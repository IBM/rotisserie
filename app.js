#!/usr/bin/env node

const express = require('express');
const fs = require('fs');
const app = express();

function main() {
  //auth with twitch
  var TwitchApi = require('twitch-api');
  var twitch = new TwitchApi({
      clientId: process.env.client_id,
      //clientSecret: process.env.client_secret,
      redirectUri: 'http://localhost',
      response_type: 'code'
  });

  var access_token = "";
  twitch.getAccessToken(twitch.code, function(err, body){
    if (err){
      console.log(err);
    }
    else {
      access_token = body.access_token;
    }
  });

  console.log(access_token);

  //serve index.html
  app.get('*', function (req, res) {
    res.sendFile(__dirname + '/public/index.html')
  });

  //start http server and log success
  app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
  });
}

main();
