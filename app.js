#!/usr/bin/env node

// TODO: determine logging strategy.

const express = require('express');
const fs = require('fs');
const path = require('path');
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
  var parameters = {'game':'PLAYERUNKNOWN\'S BATTLEGROUNDS', 'langauge':'en'};
  twitch.streams.live(parameters, function(err, body){
    if (err){
      console.log(err);
    }
    else {
      return callback(body);
    }
  });
}

function recordStreams(streamName) {
  const { spawn } = require('child_process');
  const child = spawn('livestreamer', ['-Q', '-f', 'twitch.tv/'+streamName,
                      'best', '-o', './streams/clips/'+streamName])
}

function main() {
  // init client and auth with Twitch
  var twitch = require('twitch-api-v5');
  twitch.clientID = process.env.client_id;

  var streams = "";
  listStreams(twitch, function(response) {
    streams = response;
    console.log(streams);
    // TODO: pass list of streams to recordStreams here.
  });

  ensureDir('./streams/clips');
  ensureDir('./streams/screenshots');

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
