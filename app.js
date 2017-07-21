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

function recordStream(streamName) {
  const setTimeoutPromise = util.promisify(setTimeout);
  const { spawn } = require('child_process');
  const child = spawn('livestreamer', ['-Q', '-f', 'twitch.tv/'+streamName,
                      'best', '-o', './streams/clips/'+streamName])
  setTimeoutPromise(20000).then(() => {
    console.log('stopping recording of stream ' + streamName);
    child.kill('SIGINT');
  });
}

function main() {
  // init client and auth with Twitch
  var twitch = require('twitch-api-v5');
  twitch.clientID = process.env.client_id;

  ensureDir('./streams/clips');
  ensureDir('./streams/screenshots');

  // get list of twitch streams and record each one
  listStreams(twitch, function(response) {
    for(var stream in response.streams){
      var streamName = response.streams[stream].channel.display_name;
      console.log('recording stream ' + streamName);
      recordStream(streamName);
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
