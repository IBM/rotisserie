#!/usr/bin/env node

// TODO: determine logging strategy.

const express = require('express');
const fs = require('fs');
const path = require('path');
const util = require('util');
const app = express();

const mkdirSync = function(dirPath) {
  try {
    fs.mkdirSync(dirPath);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
  }
}

function ensureDir(dirPath) {
  const parts = dirPath.split(path.sep);

  for (let i = 1; i <= parts.length; i++) {
    mkdirSync(path.join.apply(null, parts.slice(0, i)));
  }
}

function listStreams(twitch, callback) {
  var parameters = {'game':'PLAYERUNKNOWN\'S BATTLEGROUNDS', 'language':'en'};
  twitch.streams.live(parameters, function(err, body){
    if (err){
      console.log(err);
    }
    else {
      return callback(body);
    }
  });
}

function recordStream(streamName, clipsDir) {
  const setTimeoutPromise = util.promisify(setTimeout);
  const { spawn } = require('child_process');
  const child = spawn('livestreamer', ['-Q', '-f', 'twitch.tv/' + streamName,
                      'best', '-o', clipsDir + streamName + '.mp4'])
  console.log('recording clip of stream: ' + streamName);
  setTimeout(function() {
    child.kill('SIGINT');
    takeScreenshot(streamName);
  }, 20000);
}

function takeScreenshot(streamName) {
  var ffmpeg = require('fluent-ffmpeg');
  if (fs.existsSync('./streams/clips/' + streamName + '.mp4')) {
    console.log('taking screenshot of stream: ' + streamName)
    var proc = new ffmpeg('./streams/clips/' + streamName + '.mp4').takeScreenshots({
      count: 1,
      folder: './streams/thumbnails',
      filename: streamName + '.png'
    });
  }
}

function main() {
  const clipsDir = "./streams/clips/";
  const thumbnailsDir = "./streams/thumbnails/";

  // init client and auth with Twitch
  var twitch = require('twitch-api-v5');
  twitch.clientID = process.env.client_id;

  ensureDir(clipsDir);
  ensureDir(thumbnailsDir);

  // get list of twitch streams and record each one
  listStreams(twitch, function(response) {
    for(var stream in response.streams){
      var streamName = response.streams[stream].channel.display_name;
      recordStream(streamName, clipsDir);
    }
  });

  /* TODO: uncomment when writing to index.html is ready.
  //serve index.html
  app.get('*', function (req, res) {
    res.sendFile(__dirname + '/public/index.html')
  });

  //start http server and log success
  app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
  });
  */
}

main();
