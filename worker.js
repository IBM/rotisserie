#!/usr/bin/env node

const fs = require("fs");

const FFMpeg = require("fluent-ffmpeg");
const gm = require("gm").subClass({imageMagick: true});
const {spawn} = require("child_process");
const workerpool = require("workerpool");

/**
 * Records short clip of each stream gathered in listStreams.
 * @param {object} options - object of other params
 * @param {string} streamName - name of stream to record.
 * @param {string} clipsDir - Relative path to directory containing short
 * recorded clips of each stream in streamsList.
 */
function recordStream(options) {
  return new Promise ((resolve, reject) => {
    console.log("recording clip of stream: " + streamName);
    const child = spawn("livestreamer", ["-Q", "-f", "--twitch-oauth-token",
      process.env.token, "twitch.tv/" + streamName,
      "720p", "-o", clipsDir + streamName + ".mp4"]);
    setTimeout(function() {
      child.kill("SIGINT");
      console.log("recorded stream: " + streamName);
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
 * @param {requestCallback} callback - The callback that handles the response.
 */
function takeScreenshot(options) {
  return new Promise ((resolve, reject) => {
    if (fs.existsSync(options.clipsDir + options.streamName + ".mp4")) {
      console.log("taking screenshot of stream: " + options.streamName);
      new FFMpeg(options.clipsDir + options.streamName + ".mp4").takeScreenshots({
        count: 1,
        folder: options.thumbnailsDir,
        filename: options.streamName + ".png",
      }).on('end', function() {
        resolve(options)
      });
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
 */
function cropScreenshot(options) {
  return new Promise ((resolve, reject) => {
  console.log("cropping screenshot of stream: " + options.streamName);
    if (fs.existsSync(options.thumbnailsDir + options.streamName + ".png")) {
      gm(options.thumbnailsDir + options.streamName + ".png")
        .crop(28, 20, 1190, 25)
        .write(options.cropsDir + options.streamName + ".png", function(err) {
          resolve(options);
          if (err) reject(err);
        });
      console.log("cropped screenshot of: " + options.streamName);
    } else {
      reject(streamName + ": input file not found");
    }
  });
}


/**
 * @param {object} options - object of other params
 * @param {string} streamName - name of stream's screenshot to crop.
 * @param {string} cropsDir - Relative path to directory containing cropped
 * versions of all screenshots taken in takeScreenshot.
 * Verifies work
 */
function verify(options) {
  console.log("Hit verify step for stream: " + options.streamName);
  console.log("verify there is a cropped shot at: " + options.cropsDir + options.streamName + ".png");
}



/**
 * Runner for performing stream recording, screenshot taking, and screenshot
 * cropping in a worker for a given string.
 * @param {string} streamName - name of stream to process.
 */
function processStream(streamName) {

  recordStream(streamName, clipsDir);
  var data = {
      streamName: streamName,
      clipsDir: "./streams/clips/",
      thumbnailsDir: "./streams/thumbnails/",
      cropsDir:"./streams/crops/",
  }
  recordStream(data)
      .then(takeScreenshot)
      .then(cropScreenshot)
      .then(verify);
}

// create a worker and register public functions
//workerpool.worker({
//  processStream: processStream,
//});

