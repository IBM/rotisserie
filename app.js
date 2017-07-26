#!/usr/bin/env node

// built-in requirements
const fs = require("fs");
const path = require("path");

// external dependencies
const express = require("express");
const FFMpeg = require("fluent-ffmpeg");
const gm = require("gm").subClass({imageMagick: true});
const {spawn} = require("child_process");
const twitch = require("twitch-api-v5");
const tesseract = require("node-tesseract");

const app = express();

const mkdirSync = function(dirPath) {
  try {
    fs.mkdirSync(dirPath);
  } catch (err) {
    if (err.code !== "EEXIST") throw err;
  }
};

/**
 * Ensures given filesystem directory if it does not exist.
 * @param {string} dirPath - Relative or absolute path to
 * desired directory.
 */
function ensureDir(dirPath) {
  const parts = dirPath.split(path.sep);

  for (let i = 1; i <= parts.length; i++) {
    mkdirSync(path.join.apply(null, parts.slice(0, i)));
  }
}

/**
 * Gets list of PUBG streams from Twitch API v5.
 * @callback {object} body - JSON object from Twitch API call. Contains list
 * of English language PUBG streams and their associated metadata.
 * @param {string} twitch - Authenticated Twitch client object.
 * @param {requestCallback} callback - The callback that handles the response.
 */
function listStreams(twitch, callback) {
  let parameters = {"game": "PLAYERUNKNOWN\'S BATTLEGROUNDS", "language": "en"};

  twitch.streams.live(parameters, function(err, body) {
    if (err) console.log(err);
    else return callback(body);
  });
}

/**
 * Records short clip of each stream gathered in listStreams.
 * @callback {string} - log message indicating all streams have a clip
 * recorded.
 * @param {object} streamsList - JSON object containing list of streams
 * and their associated metadata.
 * @param {string} clipsDir - Relative path to directory containing short
 * recorded clips of each stream in streamsList.
 * @param {requestCallback} callback - The callback that handles the response.
 * @return {requestCallback} callback - The callback that sends the log
 * message.
 */
function recordStreams(streamsList, clipsDir, callback) {
  for (let stream in streamsList.streams) {
    let streamName = streamsList.streams[stream].channel.display_name;
    console.log("recording clip of stream: " + streamName);

    const child = spawn("livestreamer", ["-Q", "-f", "twitch.tv/" + streamName,
      "720p", "-o", clipsDir + streamName + ".mp4"]);
    setTimeout(function() {
      child.kill("SIGINT");
    }, 20000);
  }
  return callback("recorded all streams");
}

/**
 * Takes screenshots of all clips recorded in recordStreams.
 * @callback {string} - log message indicating all clips have had a screenshot
 * taken from them.
 * @param {object} streamsList - JSON object containing list of streams
 * and their associated metadata.
 * @param {string} clipsDir - Relative path to directory containing short
 * recorded clips of each stream in streamsList.
 * @param {string} thumbnailsDir - Relative path to directory containing
 * screenshots of each clip recorded in recordStreams.
 * @param {requestCallback} callback - The callback that handles the response.
 * @return {requestCallback} callback - The callback that sends the log
 * message.
 */
function takeScreenshots(streamsList, clipsDir, thumbnailsDir, callback) {
  for (let stream in streamsList.streams) {
    let streamName = streamsList.streams[stream].channel.display_name;

    if (fs.existsSync(clipsDir + streamName + ".mp4")) {
      console.log("taking screenshot of stream: " + streamName);
      new FFMpeg(clipsDir + streamName + ".mp4").takeScreenshots({
        count: 1,
        folder: thumbnailsDir,
        filename: streamName + ".png",
      });
    }
  }
  return callback("took screenshots all streams");
}

/**
 * Crops all screenshots taken in takeScreenshots to just the area containing
 * the number of players alive in-game.
 * @callback {string} - log message indicating all screenshots have been
 * cropped.
 * @param {object} streamsList - JSON object containing list of streams
 * and their associated metadata.
 * @param {string} thumbnailsDir - Relative path to directory containing
 * screenshots of each clip recorded in recordStreams.
 * @param {string} cropsDir - Relative path to directory containing cropped
 * versions of all screenshots taken in takeScreenshots.
 * @param {requestCallback} callback - The callback that handles the response.
 * @return {requestCallback} callback - The callback that sends the log
 * message.
 */
function cropScreenshots(streamsList, thumbnailsDir, cropsDir, callback) {
  for (let stream in streamsList.streams) {
    let streamName = streamsList.streams[stream].channel.display_name;
    console.log("cropping screenshot of stream: " + streamName);

    if (fs.existsSync(thumbnailsDir + streamName + ".png")) {
      gm(thumbnailsDir + streamName + ".png")
        .crop(28, 20, 1190, 25)
        .write(cropsDir + streamName + ".png", function(err) {
          if (err) console.log(err);
        });
    }
  }
  return callback("cropped all screenshots");
}

/**
 * Uses Tesseract OCR software to interpret the number in each cropped
 * screenshot created in cropScreenshots.
 * @callback {object} - object containing the name of the stream and its
 * associated number of players alive.
 * @param {string} cropsDir - Relative path to directory containing cropped
 * versions of all screenshots taken in takeScreenshots.
 * @param {string} file - filename of cropped screenshot to interpret. Gained
 * from readdirSync call in runner.
 * @param {requestCallback} callback - The callback that handles the response.
 */
function interpretCrop(cropsDir, file, callback) {
  const options = {
    psm: 8,
    binary: "/usr/local/bin/tesseract",
  };

  tesseract.process(__dirname + cropsDir.replace(".", "") + file, options,
    function(err, text) {
      let object = {};
      object.name = file.replace(".png", "");
      object.alive = text.replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, "");
      if (object.alive && !isNaN(object.alive) && parseInt(object.alive, 10)) {
        return callback(object);
      }
    });
}

/**
 * Runs logic to get lowest stream and starts express app server.
 */
function main() {
  const clipsDir = "./streams/clips/";
  const thumbnailsDir = "./streams/thumbnails/";
  const cropsDir = "./streams/crops/";

  // auth with Twitch
  twitch.clientID = process.env.client_id;

  ensureDir(clipsDir);
  ensureDir(thumbnailsDir);
  ensureDir(cropsDir);

  // get list of twitch streams and record each one
  listStreams(twitch, function(response) {
    let streamsList = response;
    let array = [];
    recordStreams(streamsList, clipsDir, function(response) {
      console.log(response);
      setTimeout(function() {
        takeScreenshots(streamsList, clipsDir, thumbnailsDir,
          function(response) {
            console.log(response);
          });
      }, 21000);

      setTimeout(function() {
        cropScreenshots(streamsList, thumbnailsDir, cropsDir,
          function(response) {
            console.log(response);
          });
      }, 24000);

      setTimeout(function() {
        fs.readdirSync(cropsDir).forEach((file) => {
          interpretCrop(cropsDir, file, function(response) {
            array.push(response);
          });
        });
      }, 27000);

      setTimeout(function() {
        array.sort(function(a, b) {
          return a.alive - b.alive;
        });
        console.log(array);
        console.log("lowest stream: " + array[0].name);
      }, 29000);
    });
  });

  // serve index.html
  app.get("*", function(req, res) {
    res.sendFile(__dirname + "/public/index.html");
  });

  // start http server and log success
  app.listen(3000, function() {
    console.log("Example app listening on port 3000!");
  });
}

main();
