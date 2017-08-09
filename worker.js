#!/usr/bin/env node

const fs = require("fs");

const FFMpeg = require("fluent-ffmpeg");
const gm = require("gm").subClass({imageMagick: true});
const {spawn} = require("child_process");
const workerpool = require("workerpool");

/**
 * Records short clip of each stream gathered in listStreams.
 * @param {string} streamName - name of stream to record.
 * @param {string} clipsDir - Relative path to directory containing short
 * recorded clips of each stream in streamsList.
 */
function recordStream(streamName, clipsDir) {
  console.log("recording clip of stream: " + streamName);
  const child = spawn("livestreamer", ["-Q", "-f", "--twitch-oauth-token", process.env.client_id, "twitch.tv/" + streamName,
    "720p", "-o", clipsDir + streamName + ".mp4"]);
  setTimeout(function() {
    child.kill("SIGINT");
    console.log("recorded stream: " + streamName);
  }, 4000);
}

/**
 * Takes screenshots of all clips recorded in recordStreams.
 * @param {string} streamName - name of stream's clip to screenshot.
 * @param {string} clipsDir - Relative path to directory containing short
 * recorded clips of each stream in streamsList.
 * @param {string} thumbnailsDir - Relative path to directory containing
 * screenshots of each clip recorded in recordStreams.
 * @param {requestCallback} callback - The callback that handles the response.
 */
function takeScreenshot(streamName, clipsDir, thumbnailsDir) {
  if (fs.existsSync(clipsDir + streamName + ".mp4")) {
    console.log("taking screenshot of stream: " + streamName);
    new FFMpeg(clipsDir + streamName + ".mp4").takeScreenshots({
      count: 1,
      folder: thumbnailsDir,
      filename: streamName + ".png",
    });
  }
}

/**
 * Crops all screenshots taken in takeScreenshot to just the area containing
 * the number of players alive in-game.
 * @param {string} streamName - name of stream's screenshot to crop.
 * @param {string} thumbnailsDir - Relative path to directory containing
 * screenshots of each clip recorded in recordStream.
 * @param {string} cropsDir - Relative path to directory containing cropped
 * versions of all screenshots taken in takeScreenshot.
 */
function cropScreenshot(streamName, thumbnailsDir, cropsDir) {
  console.log("cropping screenshot of stream: " + streamName);
  if (fs.existsSync(thumbnailsDir + streamName + ".png")) {
    gm(thumbnailsDir + streamName + ".png")
      .crop(28, 20, 1190, 25)
      .write(cropsDir + streamName + ".png", function(err) {
        if (err) console.log(err);
      });
  }
  console.log("cropped screenshot of: " + streamName);
}


/**
 * Runner for performing stream recording, screenshot taking, and screenshot
 * cropping in a worker for a given string.
 * @param {string} streamName - name of stream to process.
 */
function processStream(streamName) {
  const clipsDir = "./streams/clips/";
  const thumbnailsDir = "./streams/thumbnails/";
  const cropsDir = "./streams/crops/";

  recordStream(streamName, clipsDir);
  setTimeout(function() {
    takeScreenshot(streamName, clipsDir, thumbnailsDir);
  }, 6000);

  setTimeout(function() {
    cropScreenshot(streamName, thumbnailsDir, cropsDir);
  }, 8000);
}

// create a worker and register public functions
workerpool.worker({
  processStream: processStream,
});
