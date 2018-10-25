#!/usr/bin/env node

// built-in requirements
const fs = require("fs");
const path = require("path");

// external dependencies
const express = require("express");
const request = require("request");
const Log = require("log");
const log = new Log("info");

// construct express app
const app = express();

const defaultGame = "fortnite";

const supportedGames = {
  "fortnite": "Fortnite",
  "pubg": "PLAYERUNKNOWN'S+BATTLEGROUNDS",
  "blackout": "Call%20of%20Duty%3A%20Black%20Ops%204",
};

// setup global list
const defaultStream = {
  "stream_name": "foo",
  "alive": 100,
  "updated": (new Date()).toJSON(),
  "stream_url": "https://example.com",
};

const currentStream = {};
const allStreams = {};

Object.keys(supportedGames).forEach(function(game) {
  allStreams[game] = [defaultStream];
  currentStream[game] = [defaultStream];
});

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
 * @param {string} game - The game to pull streams for.
 * @param {requestCallback} callback - The callback that handles the response.
 */
function listStreams(game, callback) {
  const clientID = process.env.clientID;
  let whitelist = process.env.ROTISSERIE_WHITELIST;
  let blacklist = process.env.ROTISSERIE_BLACKLIST;
  const gameURL = "https://api.twitch.tv/kraken/streams?game="+supportedGames[game]+"&language=en&stream_type=live&limit=50";
  const options = {
    url: gameURL,
    headers: {
      "Client-ID": clientID,
    },
  };

  request(options, function(error, response, body) {
    if (body === undefined || body === null) {
      log.error("No response from Twitch.");
      if (error) {
        log.error("  " + error);
      }
      return Array([]);
    }
    if (error) log.error("error:", error);
    log.info("statusCode:", response.statusCode);

    bodyJSON = JSON.parse(body);
    allAgesStreams = bodyJSON.streams.filter(function(d) {
      return d.channel.mature === false;
    });
    if (whitelist !== null && whitelist !== undefined) {
      whitelist = whitelist.split(" ");
      allAgesStreams = allAgesStreams.filter(function(d) {
        return whitelist.includes(d.channel.name);
      });
    }
    if (blacklist !== null && blacklist !== undefined) {
      blacklist = blacklist.split(" ");
      allAgesStreams = allAgesStreams.filter(function(d) {
        return !blacklist.includes(d.channel.name);
      });
    }
    usernameList = allAgesStreams.map(function(d) {
      return d.channel["display_name"];
    });
    log.info(usernameList);
    return callback(usernameList);
  });
}

/**
 * Runner for listing streams and firing up a worker for each of those streams
 * to handle the stream processing.
 * @param {string} game - The game to pull streams for.
 * @param {string} cropsDir - path to directory containing cropped thumbnails
 * containing the number of players alive.
 */
function updateStreamsList(game, cropsDir) {
  // get list of twitch streams and record each one
  listStreams(game, function(response) {
    const streamsList = response;
    log.info("Got " + streamsList.length + " streams for " + game);
    const array = [];
    const newAllStreams = [];
    for (const stream in streamsList) {
      const streamName = streamsList[stream];

      formData = {
        "stream": streamName,
      };

      const requestOptions = {
        url: "http://" + process.env.ROTISSERIE_OCR_SERVICE_HOST + ":" + process.env.ROTISSERIE_OCR_SERVICE_PORT + "/process_" + game,
        form: formData,
      };

      request.post(requestOptions, function(err, httpResponse, body) {
        if (err) {
          console.error("upload failed");
        } else {
          const parsed = JSON.parse(body);
          const object = {};
          object.name = streamName;
          object.alive = parsed.number;

          array.push(object);
        }
      });
    }

    setTimeout(function() {
      array.sort(function(a, b) {
        return a.alive - b.alive;
      });
      if (array.length > 0) {
        log.info(array);
        log.info("lowest stream: " + array[0].name);
        currentStream[game] = streamToObject(array[0]);
        for (const idx in array) {
          newAllStreams.push(streamToObject(array[idx]));
        }
        allStreams[game] = newAllStreams;
      } else {
        log.error("Empty array, not switching");
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

  ensureDir(clipsDir);
  ensureDir(thumbnailsDir);
  ensureDir(cropsDir);

  Object.keys(supportedGames).forEach(function(game) {
    // continue searching for lowest stream every 30 seconds.
    updateStreamsList(game, cropsDir);
    setInterval(function() {
      updateStreamsList(game, cropsDir);
    }, 30000);
  });

  app.set("view engine", "html");
  app.engine("html", require("hbs").__express);

  // serve index.html
  app.get("/:game?", function(req, res) {
    game = req.params.game;
    log.info(game);
    if (!game) {
      game = defaultGame;
    }

    res.render("index", {"game": game});
  });

  // serve current leader stream object
  app.get("/current/:game", function(req, res) {
    game = req.params.game;
    res.json(currentStream[game]);
  });

  // serve all stream objects
  app.get("/all/:game", function(req, res) {
    game = req.params.game;
    res.json(allStreams[game]);
  });

  app.use("/static", express.static("public"));

  // start http server and log success
  app.listen(3000, function() {
    log.info("Example app listening on port 3000!");
  });
}

main();
