#!/usr/bin/env node

// TODO: determine logging strategy.

const express = require('express');
const fs = require('fs');
const app = express();

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

function main() {
  // init client and auth with Twitch
  var twitch = require('twitch-api-v5');
  twitch.clientID = process.env.client_id;

  /* TODO: determine if obtaining an access token is required. most likely not.
  var access_token = "";
  twitch.getAccessToken(twitch.code, function(err, body){
    if (err){
      console.log(err);
    }
    else {
      access_token = body.access_token;
    }
  });
  */

  var streams = "";
  listStreams(twitch, function(response) {
    streams = response;
    console.log(streams);
    // TODO: pass list of streams to recording function here.
  });

  /* TODO: uncomment and serve when writing to index.html is ready.
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
