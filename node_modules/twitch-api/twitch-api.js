'use strict';
var request = require("request");

var baseUrl = 'https://api.twitch.tv/kraken';
var authorizePath = '/oauth2/authorize';
var accessTokenPath = '/oauth2/token';

var Twitch = function (options){
  if (!(this instanceof Twitch))
    return new Twitch(options);

  this.clientId = options.clientId;
  this.clientSecret = options.clientSecret;
  this.redirectUri = options.redirectUri;
  this.scopes = options.scopes || [];

  return this;
};

/**
 * The callback that will handle the response.
 * @callback requestCallback
 * @param err {Object} In request produces an error, it will be stored in
 *        this parameter. null if the request was successful
 * @param body {Object} The body of the response if the request was successful
 */

/**
 * Creates a request to Twitch.tv v3 API
 *
 * @access private
 *
 * @param options {Object} The options of the request
 * @param [options.method] {String} The HTTP method.
 *      'GET', 'POST', 'PUT' or 'DELETE'. Defaults to 'GET'
 * @param options.path {String} The RELATIVE path of the request
 * @param [options.accessToken] {String} The accessToken of the
 *      authenticated user
 * @param [options.body] {JSON} The JSON data to send with the request
 * @param [parameters] {Object} The URL parameters of the request in JSON format
 */
Twitch.prototype._createRequest = function(options, parameters){
  return {
    method: options.method,
    url: baseUrl + options.path,
    qs: parameters,
    headers: {
      'Authorization': options.accessToken?'OAuth ' + options.accessToken : undefined,
      'Accept': 'Accept: application/vnd.twitchtv.v3+json',
      'Client-ID': this.clientId
    },
    body: options.body,
    json: true
  };
};

/**
 * Forges and executes a request against Twitch.tv's v3 API
 *
 * @access private
 *
 * @param options {Object} The options of the request
 * @param [options.method] {String} The HTTP method.
 *      'GET', 'POST', 'PUT' or 'DELETE'. Defaults to 'GET'
 * @param options.path {String} The RELATIVE path of the request
 * @param [options.accessToken] {String} The accessToken of the
 *      authenticated user
 * @param [options.body] {JSON} The JSON data to send with the request
 * @param [parameters] {Object} The URL parameters of the request in JSON format
 * @param callback {requestCallback} The callback that will manage the response.
 */
Twitch.prototype._executeRequest = function(options, parameters, callback){
  // check for optional parameters
  if(!callback){
    callback = parameters;
    parameters = undefined;
  }

  var req = this._createRequest(options, parameters);

  request(req, function(err, response, body){
    if (!err && body && !body.error){
      callback(null, body);
    } else {
      callback(err || body);
    }
  });
};

/**
 * Returns the full URL to witch you must send your user in order to authorize
 * your application
 *
 * @returns {String} The the full URL to witch you must send your user for
 *          authorization
 */
Twitch.prototype.getAuthorizationUrl = function(){
  var scopesParam = '';
  for (var i = 0; i < this.scopes.length;  i++){
    scopesParam += this.scopes[i];
    if (i != (this.scopes.length - 1)){
      scopesParam += '+';
    }
  }

  return baseUrl + authorizePath +
    '?response_type=code' +
    '&client_id=' + this.clientId +
    '&redirect_uri=' + this.redirectUri +
    '&scope=' + scopesParam;
};

/**
 * Requests Twitch.tv for an accessCode for your authorized user
 *
 * @param code {String} The code that twitch.tv's API sent in the
 *        redirection URI parameters when the user authorized your application
 * @param callback {requestCallback} The callback that will manage the response.
 */
Twitch.prototype.getAccessToken = function(code, callback){
  var parameters = {
    client_id: this.clientId,
    client_secret: this.clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: this.redirectUri,
    code: code
  };

  this._executeRequest(
    {
      method: 'POST',
      path: accessTokenPath,
    },
    parameters,
    callback
  );

};

// ######  #       #######  #####  #    #  #####
// #     # #       #     # #     # #   #  #     #
// #     # #       #     # #       #  #   #
// ######  #       #     # #       ###     #####
// #     # #       #     # #       #  #         #
// #     # #       #     # #     # #   #  #     #
// ######  ####### #######  #####  #    #  #####

/**
 * Get user's block list
 *
 * GET /users/:user/blocks
 *
 * @param user {String} The user name of wich you want to get the block list,
 *        authenticated by accesToken
 * @param accessToken {String} The token representing the authenticated user
 * @param [parameters] {Object} The parameters of the API endpoint
 * @param callback {requestCallback} The callback that will manage the response.
 */
Twitch.prototype.getBlocks =
function (user, accessToken, parameters, callback){
  this._executeRequest(
    {
      method: 'GET',
      path: '/users/' + user + '/blocks',
      accessToken: accessToken,
    },
    parameters,
    callback
  );
};

/**
 * Add target to user's block list
 *
 * PUT /users/:user/blocks/:target
 *
 * @param user {String} The user name of the user
 * @param accessToken {String} The token representing the authenticated user
 * @param target {String} the user name your user wants to block
 * @param callback {requestCallback} The callback that will manage the response.
 */
Twitch.prototype.addBlock = function(user, accessToken, target, callback){
  this._executeRequest(
    {
      method: 'PUT',
      path: '/users/' + user + '/blocks/' + target,
      accessToken: accessToken,
    },
    callback
  );
};

/**
 * Delete target from user's block list
 *
 * DELETE /users/:user/blocks/:target
 *
 * @param user {String} The user name of the user
 * @param accessToken {String} The token representing the authenticated user
 * @param target {String} the user name your user wants to unblock
 * @param callback {requestCallback} The callback that will manage the response.
 */
Twitch.prototype.removeBlock =
function(user, accessToken, target, callback){
  this._executeRequest(
    {
      method: 'DELETE',
      path: '/users/' + user + '/blocks/' + target,
      accessToken: accessToken,
    },
    callback
  );
};


//  #####  #     #    #    #     # #     # ####### #        #####
// #     # #     #   # #   ##    # ##    # #       #       #     #
// #       #     #  #   #  # #   # # #   # #       #       #
// #       ####### #     # #  #  # #  #  # #####   #        #####
// #       #     # ####### #   # # #   # # #       #             #
// #     # #     # #     # #    ## #    ## #       #       #     #
//  #####  #     # #     # #     # #     # ####### #######  #####

/**
 * Returns a channel object.
 *
 * GET /channels/:channel/
 *
 * @param channel {String} The channel name
 * @param callback {requestCallback} The callback that will manage the response.
 */
Twitch.prototype.getChannel = function(channel, callback){
  this._executeRequest(
    {
      method: 'GET',
      path: '/channels/' + channel
    },
    callback
  );
};

/**
 * Returns a channel object of authenticated user.
 * Channel object includes stream key.
 *
 * GET /channel
 *
 * @param accessToken {String} The token representing the authenticated user
 * @param callback {requestCallback} The callback that will manage the response.
 */
Twitch.prototype.getAuthenticatedUserChannel = function(accessToken, callback){
  this._executeRequest(
    {
      method: 'GET',
      path: '/channel',
      accessToken: accessToken
    },
    callback
  );
};

/**
 * Returns a list of user objects who are editors of channel.
 * The user should be the owner (maybe editor?) of the channel
 *
 * GET /channels/:channel/editors
 *
 * @param channel {String} The channel name
 * @param accessToken {String} The token representing the authenticated user
 * @param callback {requestCallback} The callback that will manage the response.
 */
Twitch.prototype.getChannelEditors = function(channel, accessToken, callback){
  this._executeRequest(
    {
      method: 'GET',
      path: '/channels/' + channel + '/editors',
      accessToken: accessToken
    },
    callback
  );
};

/**
 * Update channel's status or game.
 *
 * PUT /channels/:channel/
 *
 * @param channel {String} The channel name
 * @param accessToken {String} The token representing the authenticated user
 * @param channelOptions {Object} The options you want to change in JSON format
 * @param channelOptions.channel {JSON} The real options are wrapped here
 * @param channelOptions.channel.status {String} The new status of the channel
 * @param channelOptions.channel.game {String} The new game of the channel
 * @param channelOptions.channel.delay {Number} The delay of the channel
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.updateChannel =
function (channel, accessToken, channelOptions, callback) {
  this._executeRequest(
    {
      method: 'PUT',
      path: '/channels/' + channel,
      accessToken: accessToken,
      body: channelOptions
    },
    callback
  );
};

/**
 * Resets channel's stream key.
 *
 * DELETE /channels/:channel/stream_key
 *
 * @param channel {String} The channel name
 * @param accessToken {String} The token representing the authenticated user
 * @param callback {requestCallback} The callback that will manage the response.
 */
Twitch.prototype.resetStreamKey =
  function (channel, accessToken, callback) {
  this._executeRequest(
    {
      method: 'DELETE',
      path: '/channels/' + channel + '/stream_key',
      accessToken: accessToken
    },
    callback
  );
};

/**
 * Start commercial on channel.
 *
 * POST /channels/:channel/commercial
 *
 * @param channel {String} The channel name
 * @param accessToken {String} The token representing the authenticated user
 * @param [parameters] {Object} The parameters of the request
 * @param [parameters.length] {Number} The length of the commercial break in
 *        seconds. One of 30, 60, 90, 120, 150 or 180. Defaults to 30.
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.startCommercial =
function (channel, accessToken, parameters, callback) {
  this._executeRequest(
    {
      method: 'POST',
      path: '/channels/' + channel + '/commercial',
      accessToken: accessToken
    },
    parameters,
    callback
  );
};

/**
 * Returns a list of team objects channel belongs to.
 *
 * GET /channels/:channel/teams
 *
 * @param channel {String} The channel name
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getChannelTeams = function(channel, callback){
  this._executeRequest(
    {
      method: 'GET',
      path: '/channels/' + channel + '/teams'
    },
    callback
  );
};

//  #####  #     #    #    #######
// #     # #     #   # #      #
// #       #     #  #   #     #
// #       ####### #     #    #
// #       #     # #######    #
// #     # #     # #     #    #
//  #####  #     # #     #    #

/**
 * Returns a links object to all other chat endpoints.
 *
 * GET /chat/:channel
 *
 * @param channel {String} The channel name
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getChannelChat = function(channel, callback){
  this._executeRequest(
    {
      method: 'GET',
      path: '/chat/' + channel,
    },
    callback
  );
};

/**
 * Returns a list of all emoticon objects for Twitch.
 *
 * GET /chat/emoticons
 *
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getEmoticons = function(callback){
  this._executeRequest(
    {
      method: 'GET',
      path: '/chat/emoticons',
    },
    callback
  );
};

/**
 * Returns a list of chat badges that can be used in the channel's chat.
 *
 * GET /chat/:channel/badges
 *
 * @param channel {String} The channel name
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getChannelBadges = function(channel, callback){
  this._executeRequest(
    {
      method: 'GET',
      path: '/chat/' + channel + '/badges',
    },
    callback
  );
};

// ####### ####### #       #       ####### #     #  #####
// #       #     # #       #       #     # #  #  # #     #
// #       #     # #       #       #     # #  #  # #
// #####   #     # #       #       #     # #  #  #  #####
// #       #     # #       #       #     # #  #  #       #
// #       #     # #       #       #     # #  #  # #     #
// #       ####### ####### ####### #######  ## ##   #####

/**
 * Returns a list of follow objects.
 *
 * GET /channels/:channel/follows
 *
 * @param channel {String} The channel name
 * @param [parameters] {Object} The parameters of the request
 *    @param [parameters.limit] {Number} Maximum number of follow objects.
 *           Maximum is 100, defaults to 25
 *    @param [parameters.offset] {Number} Follow object offset for pagination.
 *           Defaults to 0
 *    @param [parameters.direction] {String} Creation date sorting direction.
 *           Defaults to desc. Valid values are asc and desc.
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getChannelFollows = function(channel, parameters, callback){
  this._executeRequest(
    {
      method: 'GET',
      path: '/channels/' + channel + '/follows',
    },
    parameters,
    callback
  );
};

/**
 * Returns a list of follow objects
 *
 * GET /users/:user/follows/channels
 *
 * @param user {String} The user name
 * @param [parameters] {Object} The parameters of the request
 *    @param [parameters.limit] {Number} Maximum number of follow objects.
 *           Maximum is 100, defaults to 25
 *    @param [parameters.offset] {Number} Follow object offset for pagination.
 *           Defaults to 0
 *    @param [parameters.direction] {String} Creation date sorting direction.
 *            Defaults to desc. Valid values are asc and desc.
 *    @param [parameters.sortby] {String} Sort key. Defaults to created_at.
 *           Valid values are created_at, last_broadcast, and login.
 *           Defaults to desc. Valid values are asc and desc.
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getUserFollowedChannels = function(user, parameters, callback){
  this._executeRequest(
    {
      method: 'GET',
      path: '/users/' + user + '/follows/channels',
    },
    parameters,
    callback
  );
};

/**
 * Returns a follow object if user is following channel, 404 otherwise.
 *
 * GET /users/:user/follows/channels/:target
 *
 * @param user {String} The user name
 * @param channel {String} The channel name
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getUserFollowsChannel = function(user, channel, callback){
  this._executeRequest(
    {
      method: 'GET',
      path: '/users/' + user + '/follows/channels/' + channel,
    },
    callback
  );
};

/**
 * Adds user to channel's followers.
 *
 * PUT /users/:user/follows/channels/:target
 *
 * @param user {String} The user name
 * @param channel {String} The channel name
 * @param accessToken {String} The token representing the authenticated user
 * @param [parameters] {Object} The parameters of the request
 *    @param [parameters.notifications] {boolean} Whether user should receive
 *           notifications when channel goes live. Defaults to false.
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.userFollowChannel =
function(user, channel, accessToken, parameters, callback){
  this._executeRequest(
    {
      method: 'PUT',
      path: '/users/' + user + '/follows/channels/' + channel,
      accessToken: accessToken
    },
    parameters,
    callback
  );
};

/**
 * Removes user from channel's followers.
 *
 * DELETE /users/:user/follows/channels/:target
 *
 * @param user {String} The user name
 * @param channel {String} The channel name
 * @param accessToken {String} The token representing the authenticated user
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.userUnfollowChannel =
function(user, channel, accessToken, callback){
  this._executeRequest(
    {
      method: 'DELETE',
      path: '/users/' + user + '/follows/channels/' + channel,
      accessToken: accessToken
    },
    callback
  );
};

//  #####     #    #     # #######  #####
// #     #   # #   ##   ## #       #     #
// #        #   #  # # # # #       #
// #  #### #     # #  #  # #####    #####
// #     # ####### #     # #             #
// #     # #     # #     # #       #     #
//  #####  #     # #     # #######  #####

/**
 * Returns a list of games objects sorted by number of current viewers
 * on Twitch, most popular first.
 *
 * GET /games/top
 *
 * @param [parameters] {Object} The parameters of the request
 *    @param [parameters.limit] {Number} Maximum number of games.
 *           Maximum is 100, defaults to 25
 *    @param [parameters.offset] {Number} Follow object offset for pagination.
 *           Defaults to 0
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getTopGames = function(parameters, callback){
  this._executeRequest(
    {
      method: 'GET',
      path: '/games/top'
    },
    parameters,
    callback
  );
};

// ### #     #  #####  #######  #####  #######  #####
//  #  ##    # #     # #       #     #    #    #     #
//  #  # #   # #       #       #          #    #
//  #  #  #  # #  #### #####    #####     #     #####
//  #  #   # # #     # #             #    #          #
//  #  #    ## #     # #       #     #    #    #     #
// ### #     #  #####  #######  #####     #     #####

/**
 * Returns a list of ingest objects.
 *
 * GET /ingests/
 *
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getIngests = function(callback){
  this._executeRequest(
    {
      method: 'GET',
      path: '/ingests'
    },
    callback
  );
};

// ######  ####### ####### #######
// #     # #     # #     #    #
// #     # #     # #     #    #
// ######  #     # #     #    #
// #   #   #     # #     #    #
// #    #  #     # #     #    #
// #     # ####### #######    #

/**
 * Basic information about the API and authentication status.
 * If you are accessToken is provided, the response includes the status of your
 * token and links to other related resources.
 *
 * GET /
 *
 * @param [accessToken] {String} The token representing the authenticated user
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getRoot = function(accessToken, callback){
  // acccessToken is optional
  if (!callback){
   callback = accessToken;
   accessToken = undefined;
  }

  this._executeRequest(
    {
      method: 'GET',
      path: '/',
      accessToken: accessToken
    },
    callback
  );
};

//  #####  #######    #    ######   #####  #     #
// #     # #         # #   #     # #     # #     #
// #       #        #   #  #     # #       #     #
//  #####  #####   #     # ######  #       #######
//       # #       ####### #   #   #       #     #
// #     # #       #     # #    #  #     # #     #
//  #####  ####### #     # #     #  #####  #     #

/**
 * Convenience method to search by entity
 *
 * @access private
 *
 * @param entity {String} Entity to search by
 * @param [parameters] {Object} Parameters of the seach, content depends on entity
 * @param accessToken {String} The token representing the authenticated user
 */
Twitch.prototype._search = function(entity, parameters, callback){
  this._executeRequest(
    {
      method: 'GET',
      path: '/search/' + entity
    },
    parameters,
    callback
  );
};

/**
 * Returns a list of channel objects matching the search query.
 *
 * GET /search/channels
 *
 * @param parameters {Object} The parameters of the request
 *    @param parameters.query {String} Search query. The field can also be
 *           parameters.q
 *    @param [parameters.limit] {Number} Maximum number of channel objects.
 *           Maximum is 100, defaults to 25
 *    @param [parameters.offset] {Number} Follow object offset for pagination.
 *           Defaults to 0
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.searchChannels = function(parameters, callback){
  this._search('channels', parameters, callback);
};

/**
 * Returns a list of stream objects matching the search query.
 *
 * GET /search/streams
 *
 * @param parameters {Object} The parameters of the request
 *    @param parameters.query {String} Search query. The field can also be
 *           parameters.q
 *    @param [parameters.limit] {Number} Maximum number of stream objects.
 *           Maximum is 100, defaults to 25
 *    @param [parameters.offset] {Number} Follow object offset for pagination.
 *           Defaults to 0
 *    @param [parameters.hls] {boolean} If set to true, only returns streams
 *           using HLS. If set to false, only returns streams that are non-HLS.
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.searchStreams = function(parameters, callback){
  this._search('streams', parameters, callback);
};

/**
 * Returns a list of game objects matching the search query.
 *
 * GET /search/games
 *
 * @param parameters {Object} The parameters of the request
 *    @param parameters.query {String} Search query. The field can also be
 *           parameters.q
 *    @param parameters.type {String} Only accepts suggest: Suggests a list of
 *           games similar to query
 *    @param [parameters.live] {boolean} If true, only returns games that are
 *           live on at least one channel.
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.searchGames = function(parameters, callback){
  this._search('games', parameters, callback);
};

//  #####  ####### ######  #######    #    #     #  #####
// #     #    #    #     # #         # #   ##   ## #     #
// #          #    #     # #        #   #  # # # # #
//  #####     #    ######  #####   #     # #  #  #  #####
//       #    #    #   #   #       ####### #     #       #
// #     #    #    #    #  #       #     # #     # #     #
//  #####     #    #     # ####### #     # #     #  #####

/**
 * Returns a stream object if live.
 *
 * GET /streams/:channel/
 *
 * @param channel {String} The channel name
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getChannelStream = function (channel, callback) {
  this._executeRequest(
    {
      method: 'GET',
      path: '/streams/' + channel
    },
    callback
  );
};

/**
 * Returns a list of stream objects that are queried by a number of parameters
 * sorted by number of viewers descending.
 *
 * GET /streams
 *
 * @param [parameters] {Object} The parameters of the request
 *    @param [parameters.game] {String} Streams categorized under game.
 *    @param [parameters.channel] {String} Streams from a comma separated
 *           list of channels.
 *    @param [parameters.limit] {Number} Maximum number of streams.
 *           Maximum is 100, defaults to 25
 *    @param [parameters.offset] {Number} Follow object offset for pagination.
 *           Defaults to 0
 *    @param [parameters.client_id] {String} Only shows streams from
 *           applications of client_id.
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getStreams = function (parameters, callback) {
  this._executeRequest(
    {
      method: 'GET',
      path: '/streams'
    },
    parameters,
    callback
  );
};

/**
 * Returns a list of featured (promoted) stream objects.
 *
 * GET /streams/featured
 *
 * @param [parameters] {Object} The parameters of the request
 *    @param [parameters.limit] {Number} Maximum number of streams.
 *           Maximum is 100, defaults to 25
 *    @param [parameters.offset] {Number} Follow object offset for pagination.
 *           Defaults to 0
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getFeaturedStreams = function (parameters, callback) {
  this._executeRequest(
    {
      method: 'GET',
      path: '/streams/featured'
    },
    parameters,
    callback
  );
};

/**
 * Returns a summary of current streams.
 *
 * GET /streams/summary
 *
 * @param [parameters] {Object} The parameters of the request
 *    @param [parameters.game] {String} Streams categorized under game.
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getStreamsSummary = function (parameters, callback) {
  this._executeRequest(
    {
      method: 'GET',
      path: '/streams/summary'
    },
    parameters,
    callback
  );
};

//  #####  #     # ######   #####
// #     # #     # #     # #     #
// #       #     # #     # #
//  #####  #     # ######   #####
//       # #     # #     #       # ###
// #     # #     # #     # #     # ###
//  #####   #####  ######   #####  ###

/**
 * Returns a list of subscription objects sorted by subscription relationship
 * creation date which contain users subscribed to channel.
 *
 * GET /channels/:channel/subscriptions
 *
 * @param channel {String} The channel name
 * @param accessToken {String} The token representing the authenticated user
 * @param [parameters] {Object} The parameters of the request
 *    @param [parameters.limit] {Number} Maximum number of subscription objects.
 *           Maximum is 100, defaults to 25
 *    @param [parameters.offset] {Number} Follow object offset for pagination.
 *           Defaults to 0
 *    @param [parameters.direction] {String} Creation date sorting direction.
 *            Defaults to asc. Valid values are asc and desc.
 */
Twitch.prototype.getChannelSubscriptions =
function (channel, accessToken, parameters, callback) {
  this._executeRequest(
    {
      method: 'GET',
      path: '/channels/' + channel + '/subscriptions',
      accessToken: accessToken
    },
    parameters,
    callback
  );
};

/**
 * Returns a subscription object which includes the user if that user
 * is subscribed. Requires authentication for channel.
 * The authenticated user must be the owner of the channel
 *
 * GET /channels/:channel/subscriptions/:user
 *
 * @param user {String} The user name
 * @param channel {String} The channel name
 * @param accessToken {String} The token representing the authenticated user
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getUserSubscriptionToChannel =
function (user, channel, accessToken, callback) {
  this._executeRequest(
    {
      method: 'GET',
      path: '/channels/' + channel + '/subscriptions/' + user,
      accessToken: accessToken
    },
    callback
  );
};

/**
 * Returns a channel object that user subscribes to. user must be authenticated
 * by accessToken.
 *
 * GET /users/:user/subscriptions/:channel
 *
 * @param user {String} The user name
 * @param channel {String} The channel name
 * @param accessToken {String} The token representing the authenticated user
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getChannelSubscriptionOfUser =
function (user, channel, accessToken, callback) {
  this._executeRequest(
    {
      method: 'GET',
      path: '/users/' + user + '/subscriptions/' + channel,
      accessToken: accessToken
    },
    callback
  );
};

// ####### #######    #    #     #  #####
//    #    #         # #   ##   ## #     #
//    #    #        #   #  # # # # #
//    #    #####   #     # #  #  #  #####
//    #    #       ####### #     #       #
//    #    #       #     # #     # #     #
//    #    ####### #     # #     #  #####

/**
 * Returns a list of active teams.
 *
 * GET /teams/
 *
 * @param [parameters] {Object} The parameters of the request
 *    @param [parameters.limit] {Number} Maximum number of teams.
 *           Maximum is 100, defaults to 25
 *    @param [parameters.offset] {Number} Follow object offset for pagination.
 *           Defaults to 0
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getTeams = function (parameters, callback) {
  this._executeRequest(
    {
      method: 'GET',
      path: '/teams'
    },
    parameters,
    callback
  );
};

/**
 * Returns a team object for team.
 *
 * GET /teams/:team/
 *
 * @param team {String} The team name
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getTeam = function (team, callback) {
  this._executeRequest(
    {
      method: 'GET',
      path: '/teams/' + team
    },
    callback
  );
};

// #     #  #####  ####### ######   #####
// #     # #     # #       #     # #     #
// #     # #       #       #     # #
// #     #  #####  #####   ######   #####
// #     #       # #       #   #         #
// #     # #     # #       #    #  #     #
//  #####   #####  ####### #     #  #####

/**
 * Returns a user object.
 *
 * GET /users/:user
 *
 * @param user {String} The user name of the user
 * @param callback {requestCallback} The callback that will manage the response.
 */
Twitch.prototype.getUser = function (user, callback) {
  this._executeRequest(
    {
      method: 'GET',
      path: '/users/' + user
    },
    callback
  );
};

/**
 * Returns a user object that represents the user authenticated by accessToken.
 *
 * GET /user
 *
 * @param accessToken {String} The token representing the authenticated user
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getAuthenticatedUser = function (accessToken, callback) {
  this._executeRequest(
    {
      method: 'GET',
      path: '/user',
      accessToken: accessToken
    },
    callback
  );
};

/**
 * Returns a list of stream objects that the authenticated user is following.
 *
 * GET /streams/followed
 *
 * @param accessToken {String} The token representing the authenticated user
 * @param [parameters] {Object} The parameters of the request
 *    @param [parameters.limit] {Number} Maximum number of streams.
 *           Maximum is 100, defaults to 25
 *    @param [parameters.offset] {Number} Follow object offset for pagination.
 *           Defaults to 0
 *    @param [parameters.stream_type] {String} Only shows streams from a certain
 *           type. Permitted values: all, playlist, live
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getAuthenticatedUserFollowedStreams =
function (accessToken, parameters, callback) {
  this._executeRequest(
    {
      method: 'GET',
      path: '/streams/followed',
      accessToken: accessToken
    },
    parameters,
    callback
  );
};

/**
 * Returns a list of video objects from channels that the authenticated user
 * is following.
 *
 * GET /videos/followed
 *
 * @param accessToken {String} The token representing the authenticated user
 * @param [parameters] {Object} The parameters of the request
 *    @param [parameters.limit] {Number} Maximum number of videos.
 *           Maximum is 100, defaults to 25
 *    @param [parameters.offset] {Number} Follow object offset for pagination.
 *           Defaults to 0
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getAuthenticatedUserFollowedVideos =
function (accessToken, parameters, callback) {
  this._executeRequest(
    {
      method: 'GET',
      path: '/videos/followed',
      accessToken: accessToken
    },
    parameters,
    callback
  );
};

// #     # ### ######  ####### #######  #####
// #     #  #  #     # #       #     # #     #
// #     #  #  #     # #       #     # #
// #     #  #  #     # #####   #     #  #####
//  #   #   #  #     # #       #     #       #
//   # #    #  #     # #       #     # #     #
//    #    ### ######  ####### #######  #####

/**
 * Returns a video object.
 *
 * GET /videos/:id
 *
 * @param videoId {String} The id of the video
 * @param callback {requestCallback} The callback that will manage the response.
 */
Twitch.prototype.getVideo = function (videoId, callback) {
  this._executeRequest(
    {
      method: 'GET',
      path: '/videos/' + videoId
    },
    callback
  );
};

/**
 * Returns a list of videos created in a given time period sorted by number of
 * views, most popular first.
 *
 * GET /videos/top
 *
 * @param [parameters] {Object} The parameters of the request
 *    @param [parameters.limit] {Number} Maximum number of videos.
 *           Maximum is 100, defaults to 25
 *    @param [parameters.offset] {Number} Follow object offset for pagination.
 *           Defaults to 0
 *    @param [parameters.game] {String} Returns only videos from game.
 *    @param [parameters.period] {String} Returns only videos created in time
 *           period. Valid values are week, month, or all. Defaults to week.
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getTopVideos = function (parameters, callback) {
  this._executeRequest(
    {
      method: 'GET',
      path: '/videos/top'
    },
    parameters,
    callback
  );
};

/**
 * Returns a list of videos ordered by time of creation, starting with
 * the most recent from channel.
 *
 * GET /channels/:channel/videos
 *
 * @param channel {String} The channel name
 * @param [parameters] {Object} The parameters of the request
 *    @param [parameters.limit] {Number} Maximum number of videos.
 *           Maximum is 100, defaults to 25
 *    @param [parameters.offset] {Number} Follow object offset for pagination.
 *           Defaults to 0
 *    @param [parameters.broadcasts] {boolean} Returns only broadcasts
 *           when true, only highlights when false. Defaults to false.
 *    @param [parameters.hls] {boolean} If set to true, only returns streams
 *           using HLS. If set to false, only returns streams that are non-HLS.
 * @param callback {requestCallback} The callback that will manage the response
 */
Twitch.prototype.getChannelVideos = function (channel, parameters, callback) {
  this._executeRequest(
    {
      method: 'GET',
      path: '/channels/' + channel + '/videos'
    },
    parameters,
    callback
  );
};

module.exports =  Twitch;
