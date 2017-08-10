#!/usr/bin/env node

// built-in requirements
const fs = require("fs");
const path = require("path");

// external dependencies
const express = require("express");
const tesseract = require("node-tesseract");
const twitch = require("twitch-api-v5");
const workerpool = require("workerpool");

// construct express app
const app = express();

let currentStream = {"stream_name": "foo", "stream_url": "https://example.com"};

/**
 * Ensures given filesystem directory if it does not exist.
 * @param {string} dirPath - Relative or absolute path to
 * desired directory.
 */
function ensureDir(dirPath) {
  const parts = dirPath.split(path.sep);
  const mkdirSync = function(dirPath) {
    try {
      fs.mkdirSync(dirPath);
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
    }
  };

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
 * Uses Tesseract OCR software to interpret the number in each cropped
 * screenshot created in cropScreenshots.
 * @callback {object} - object containing the name of the stream and its
 * associated number of players alive.
 * @param {string} cropsDir - Relative path to directory containing cropped
 * versions of all screenshots taken in takeScreenshot.
 * @param {string} file - filename of cropped screenshot to interpret. Gained
 * from readdirSync call in runner.
 * @param {requestCallback} callback - The callback that handles the response.
 */
function interpretCrop(cropsDir, file, callback) {
  const options = {
    psm: 8,
  };

  console.log("interpreting: " + __dirname + cropsDir.replace(".", "") + file);
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
 * Runner for listing streams and firing up a worker for each of those streams
 * to handle the stream processing.
 * @param {object} pool - pool of workers to offload stream processing tasks on.
 * @param {string} cropsDir - path to directory containing cropped thumbnails
 * containing the number of players alive.
 */
function getLowestStream(pool, cropsDir) {
  // get list of twitch streams and record each one
  listStreams(twitch, function(response) {
    let streamsList = response;
    let array = [];

    for (let stream in streamsList.streams) {
      let streamName = streamsList.streams[stream].channel.display_name;
      pool.exec("processStream", [streamName])
        .catch(function(err) {
          console.log(err);
        })
        .then(function(response) {
          // pool.clear(false);
        });
    }

    setTimeout(function() {
      fs.readdirSync(cropsDir).forEach((file) => {
        interpretCrop(cropsDir, file, function(response) {
          array.push(response);
        });
      });
    }, 10000);

    setTimeout(function() {
      array.sort(function(a, b) {
        return a.alive - b.alive;
      });
      console.log(array);
      console.log("lowest stream: " + array[0].name);
      setCurrentStream(array[0]);
    }, 14000);
  });
}

/**
 * Sets webpage to stream with lowest number of players alive, determined by
 * getLowestStream.
 * @param {object} stream - object containing name of string and number of
 * players alive.
 */
function setCurrentStream(stream) {
  currentStream["stream_name"] = stream.name;
  currentStream["alive"] = stream.alive;
  currentStream["stream_url"] = "https://player.twitch.tv/?channel=" + stream.name;
  currentStream["updated"] = (new Date()).toJSON();
}

/**
 * Runs logic to get lowest stream and starts express app server.
 */
function main() {
  const clipsDir = "./streams/clips/";
  const thumbnailsDir = "./streams/thumbnails/";
  const cropsDir = "./streams/crops/";
  let pool = workerpool.pool(__dirname + "/worker.js");

  // auth with Twitch
  twitch.clientID = process.env.token;

  ensureDir(clipsDir);
  ensureDir(thumbnailsDir);
  ensureDir(cropsDir);

  // init website with lowest stream.
  getLowestStream(pool, cropsDir);

  // continue searching for lowest stream every 15 seconds.
  setInterval(function() {
    getLowestStream(pool, cropsDir);
  }, 15000);

  // serve index.html
  app.get("/", function(req, res) {
    res.sendFile(__dirname + "/public/index.html");
  });

  // serve current stream url
  app.get("/current", function(req, res) {
    res.json(currentStream);
  });

  app.use(express.static("public"));

  // start http server and log success
  app.listen(3000, function() {
    console.log("Example app listening on port 3000!");
  });
}

main();
