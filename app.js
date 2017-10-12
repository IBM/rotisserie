#!/usr/bin/env node

// built-in requirements
const fs = require("fs");
const path = require("path");

// external dependencies
const express = require("express");
const request = require("request");
const twitch = require("twitch-api-v5");

const FFMpeg = require("fluent-ffmpeg");
const gm = require("gm").subClass({imageMagick: true});
const {spawn} = require("child_process");

// construct express app
const app = express();

// setup global list
let currentStream = {
  "stream_name": "foo",
  "alive": 100,
  "updated": (new Date()).toJSON(),
  "stream_url": "https://example.com",
};
let allStreams = [currentStream];
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
  let parameters = {"game": "PLAYERUNKNOWN\'S BATTLEGROUNDS",
    "language": "en", "limit": 25};

  twitch.streams.live(parameters, function(err, body) {
    if (err) console.log(err);
    else {
      allAgesStreams = body.streams.filter(function(stream) {
        return stream.channel.mature == false;
      });
      return callback(allAgesStreams);
    }
  });
}

/**
 * Records short clip of each stream gathered in listStreams.
 * @param {object} options - object of other params
 * @param {string} streamName - name of stream to record.
 * @param {string} clipsDir - Relative path to directory containing short
 * recorded clips of each stream in streamsList.
 * @return {promise} - A promise that resolves if a stream is recorded.
 */
function recordStream(options) {
  return new Promise((resolve, reject) => {
    console.log("recording clip of stream: " + options.streamName);
    const child = spawn("livestreamer", ["--yes-run-as-root", "-Q", "-f",
      "--twitch-oauth-token", process.env.token,
      "twitch.tv/" + options.streamName, "720p", "-o",
      options.clipsDir + options.streamName + ".mp4"]);
    setTimeout(function() {
      child.kill("SIGINT");
      console.log("recorded stream: " + options.streamName);
      resolve(options);
    }, 4000);
  });
}

/**
 * Takes screenshots of all clips recorded in recordStreams.
 * @param {object} options - object of other params
 * @param {string} streamName - name of stream's clip to screenshot.
 * @param {string} clipsDir - Relative path to directory containing short
 * recorded clips of each stream in streamsList.
 * @param {string} thumbnailsDir - Relative path to directory containing
 * screenshots of each clip recorded in recordStreams.
 * @return {promise} - a promise that resolves if a screenshot is taken.
 */
function takeScreenshot(options) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(options.clipsDir + options.streamName + ".mp4")) {
      console.log("taking screenshot of stream: " + options.streamName);
      new FFMpeg(options.clipsDir + options.streamName + ".mp4")
        .takeScreenshots({
          timestamps: [0],
          folder: options.thumbnailsDir,
          filename: options.streamName + ".png",
        })
        .on("end", function() {
          resolve(options);
        })
        .on("error", function(err) {
          fs.unlinkSync(options.clipsDir + options.streamName + ".mp4");
          console.log("Deleted " + options.clipsDir
                        + options.streamName + ".mp4");
          reject(new Error("An error occurred: " + err.message));
        });
    } else {
      reject(new Error("File " + options.clipsDir
        + options.streamName + ".mp4 not found."));
    }
  });
}

/**
 * Crops all screenshots taken in takeScreenshot to just the area containing
 * the number of players alive in-game.
 * @param {object} options - object of other params
 * @param {string} streamName - name of stream's screenshot to crop.
 * @param {string} thumbnailsDir - Relative path to directory containing
 * screenshots of each clip recorded in recordStream.
 * @param {string} cropsDir - Relative path to directory containing cropped
 * versions of all screenshots taken in takeScreenshot.
 * @return {promise} - a promise which resolves if a screenshot is cropped.
 */
function cropScreenshot(options) {
  return new Promise((resolve, reject) => {
    console.log("cropping screenshot of stream: " + options.streamName);
    if (fs.existsSync(options.thumbnailsDir + options.streamName + ".png")) {
      gm(options.thumbnailsDir + options.streamName + ".png")
        .crop(28, 20, 1190, 25)
        .type("Grayscale")
        .write(options.cropsDir + options.streamName + ".png", function(err) {
          resolve(options);
          if (err) reject(err);
        });
      console.log("cropped screenshot of: " + options.streamName);
    } else {
      reject(new Error(options.streamName + ": input file not found"));
    }
  });
}


/**
 * OCR the data (via web request)
 * Uses the rotisserie-ocr microservice
 * @param {object} options - object of other params
 * @return {promise} - a promise that is resolved if the a screenshot is ocr'd
 * successfully.
 */
function ocrCroppedShot(options) {
  return new Promise((resolve, reject) => {
    let formData = {
      image: fs.createReadStream(__dirname
                                 + options.cropsDir.replace(".", "")
                                 + options.streamName + ".png"),
    };

    let requestOptions = {
      url: "http://" + process.env.OCR_HOST + "/process_pubg",
      formData: formData,
    };

    request.post(requestOptions, function(err, httpResponse, body) {
      if (err) {
        console.error("upload failed");
        reject(err);
      } else {
        let parsed = JSON.parse(body);
        let object = {};
        object.name = options.streamName;
        object.alive = parsed.number;
        resolve(object);
      }
    });
  });
}

/**
 * Runner for listing streams and firing up a worker for each of those streams
 * to handle the stream processing.
 * @param {string} cropsDir - path to directory containing cropped thumbnails
 * containing the number of players alive.
 */
function updateStreamsList(cropsDir) {
  // get list of twitch streams and record each one
  listStreams(twitch, function(response) {
    let streamsList = response;
    console.log(streamsList.length);
    let array = [];
    let newAllStreams = [];
    for (let stream in streamsList) {
      let streamName = streamsList[stream].channel.display_name;
      const data = {
        streamName: streamName,
        clipsDir: "./streams/clips/",
        thumbnailsDir: "./streams/thumbnails/",
        cropsDir: "./streams/crops/",
      };

      recordStream(data)
        .then(takeScreenshot)
        .then(cropScreenshot)
        .then(ocrCroppedShot)
        .then(function(streamobj) {
          console.log(streamobj.name + " = " + streamobj.alive + " alive.");
          array.push(streamobj);
        }).catch((error) => {
          console.log(error.message);
        });
    }
    setTimeout(function() {
      array.sort(function(a, b) {
        return a.alive - b.alive;
      });
      if (array.length > 0) {
        console.log(array);
        console.log("lowest stream: " + array[0].name);
        currentStream = streamToObject(array[0]);
        for (let idx in array) {
          newAllStreams.push(streamToObject(array[idx]));
        }
        allStreams = newAllStreams;
      } else {
        console.log("Empty array, not switching");
      }
    }, 25000);
  });
}

/**
  Sets webpage to stream with lowest number of players alive, determined by
 * getLowestStream.
 * @param {object} stream - object containing name of string and number of
 * players alive.
 * @return {object} object - stream object containing stream metadata.
 */
function streamToObject(stream) {
  object = {};
  object["stream_name"] = stream.name;
  object["alive"] = stream.alive;
  object["stream_url"] = "https://player.twitch.tv/?channel=" + stream.name;
  object["updated"] = (new Date()).toJSON();
  return object;
}

/**
 * Runs logic to get lowest stream and starts express app server.
 */
function main() {
  const clipsDir = "./streams/clips/";
  const thumbnailsDir = "./streams/thumbnails/";
  const cropsDir = "./streams/crops/";

  // auth with Twitch
  twitch.clientID = process.env.token;

  ensureDir(clipsDir);
  ensureDir(thumbnailsDir);
  ensureDir(cropsDir);

  // init website with lowest stream.
  updateStreamsList(cropsDir);

  // continue searching for lowest stream every 30 seconds.
  setInterval(function() {
    updateStreamsList(cropsDir);
  }, 30000);

  // serve index.html
  app.get("/", function(req, res) {
    res.sendFile(__dirname + "/public/index.html");
  });

  // serve current leader stream object
  app.get("/current", function(req, res) {
    res.json(currentStream);
  });

  // serve all stream objects
  app.get("/all", function(req, res) {
    res.json(allStreams);
  });

  app.use(express.static("public"));

  // start http server and log success
  app.listen(3000, function() {
    console.log("Example app listening on port 3000!");
  });
}

main();
