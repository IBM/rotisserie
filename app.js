#!/usr/bin/env node

// built-in requirements
const fs = require('fs');
const path = require('path');
const util = require('util');

// external dependencies
const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const gm = require('gm').subClass({imageMagick: true});
const { spawn } = require('child_process');
const twitch = require('twitch-api-v5');
const tesseract = require('node-tesseract');

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

function recordStreams(streamsList, clipsDir, callback) {
  for(var stream in streamsList.streams){
    var streamName = streamsList.streams[stream].channel.display_name;
    console.log('recording clip of stream: ' + streamName);

    const child = spawn('livestreamer', ['-Q', '-f', 'twitch.tv/' + streamName,
                        '720p', '-o', clipsDir + streamName + '.mp4'])
    setTimeout(function() {
      child.kill('SIGINT');
    }, 20000);
  }
  return callback('recorded all streams');
}

function takeScreenshots(streamsList, clipsDir, thumbnailsDir, callback) {
  for(var stream in streamsList.streams){
    var streamName = streamsList.streams[stream].channel.display_name;

    if (fs.existsSync(clipsDir + streamName + '.mp4')) {
      console.log('taking screenshot of stream: ' + streamName)
      var proc = new ffmpeg(clipsDir + streamName + '.mp4').takeScreenshots({
        count: 1,
        folder: thumbnailsDir,
        filename: streamName + '.png'
      });
    }
  }
  return callback('screenshotted all streams');
}

function cropScreenshots(streamsList, thumbnailsDir, cropsDir, callback) {
  for(var stream in streamsList.streams){
    var streamName = streamsList.streams[stream].channel.display_name;
    console.log('cropping screenshot of stream: ' + streamName);

    if (fs.existsSync(thumbnailsDir + streamName + '.png')) {
      gm(thumbnailsDir + streamName + '.png')
        .crop(28, 20, 1190, 25)
        .write(cropsDir + streamName + '.png', function(err) {
          if (err) console.log(err);
        });
    }
  }
  return callback('cropped all screenshots');
}

function interpretCrop(cropsDir, file, callback) {
  var options = {
    psm: 8,
    binary: '/usr/local/bin/tesseract'
  };

  tesseract.process(__dirname + cropsDir.replace(".", "") + file, options,
                    function(err, text) {
    var object = {};
    object.name = file.replace(".png", "");
    object.alive = text.replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, '');;
    if(object.alive && !isNaN(object.alive) && parseInt(object.alive, 10)) {
      return callback(object);
    }
  });
}

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
    var streamsList = response;
    var array = [];
    recordStreams(streamsList, clipsDir, function(response) {
      console.log(response);
      setTimeout(function() {
        takeScreenshots(streamsList, clipsDir, thumbnailsDir, function(response) {
        console.log(response);
        });
      }, 21000);
      setTimeout(function() {
        cropScreenshots(streamsList, thumbnailsDir, cropsDir, function(response) {
        console.log(response);
        });
      }, 24000);
      setTimeout(function() {
        fs.readdirSync(cropsDir).forEach(file => {
          interpretCrop(cropsDir, file, function(response){
            array.push(response);
          });
        });
      }, 27000);
      setTimeout(function() {
        array.sort(function(a, b){return a.alive-b.alive});
        console.log(array);
        console.log('lowest stream: ' + array[0].name);
      }, 29000);
    });
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
