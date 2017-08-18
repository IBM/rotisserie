#!/usr/bin/env node

// built-in requirements
const fs = require("fs");
const path = require("path");

// external dependencies
const express = require("express");
const request = require("request");
const twitch = require("twitch-api-v5");
const workerpool = require("workerpool");

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
  let parameters = {"game": "PLAYERUNKNOWN\'S BATTLEGROUNDS", "language": "en"};

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
 * Runner for listing streams and firing up a worker for each of those streams
 * to handle the stream processing.
 * @param {object} pool - pool of workers to offload stream processing tasks on.
 * @param {string} cropsDir - path to directory containing cropped thumbnails
 * containing the number of players alive.
 */
function updateStreamsList(pool, cropsDir) {
  // get list of twitch streams and record each one
  listStreams(twitch, function(response) {
    let streamsList = response;
    let array = [];
    let newAllStreams = [];

    for (let stream in streamsList) {
      let streamName = streamsList[stream].channel.display_name;
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
        let formData = {
          image: fs.createReadStream(__dirname
                                     + cropsDir.replace(".", "") + file),
        };

        let requestOptions = {
          url: "http://localhost:3001/process_pubg",
          formData: formData,
        };

        request.post(requestOptions, function(err, httpResponse, body) {
          if (err) {
            return console.error("upload failed");
          }
          let parsed = JSON.parse(body);
          let object = {};
          object.name = file.replace(".png", "");
          object.alive = parsed.number;
          array.push(object);
        });
      });
    }, 10000);

    setTimeout(function() {
      array.sort(function(a, b) {
        return a.alive - b.alive;
      });
      console.log(array);
      console.log("lowest stream: " + array[0].name);
      currentStream = streamToObject(array[0]);
      for (let idx in array) {
        newAllStreams.push(streamToObject(array[idx]));
      }
      allStreams = newAllStreams;
    }, 14000);
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
  let pool = workerpool.pool(__dirname + "/worker.js");

  // auth with Twitch
  twitch.clientID = process.env.token;

  ensureDir(clipsDir);
  ensureDir(thumbnailsDir);
  ensureDir(cropsDir);

  // init website with lowest stream.
  updateStreamsList(pool, cropsDir);

  // continue searching for lowest stream every 15 seconds.
  setInterval(function() {
    updateStreamsList(pool, cropsDir);
  }, 15000);

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
