# twitch-api
Module for easily using all [twitch.tv](http://twitch.tv) API v3 endpoints in nodejs

## Installation
`npm install twitch-api`

## Usage

Follow the [Authorization Code Flow](https://github.com/justintv/Twitch-API/blob/master/authentication.md#authorization-code-flow) that you can find in the [official twitch.tv API v3 documentation](https://github.com/justintv/Twitch-API):
1. Send the user you'd like to authenticate to twitch.tv's authentication URL (you can get this URL using the convenience method `getAuthorizationUrl` **once the module is initiallized**)
2. If the user authorizes your application, she will be redirected to `https://[your registered redirect URI]/?code=[CODE]`. There you can get the `code` you need to get the user's *access token*.

### Step 1: Initialization
```javascript
var TwitchApi = require('twitch-api');
var twitch = new TwitchApi({
    clientId: 'your client id',
    clientSecret: 'your client secret',
    redirectUri: 'same redirectUri that you have configured on your app',
    scopes: [array of scopes you want access to]
  });
```

### Step 2: Get the user's access token
```javascript
twitch.getAccessToken(code, function(err, body){
    if (err){
      console.log(err);
    } else {
      /*
      * body = {
      *   access_token: 'your authenticated user access token',
      *   scopes: [array of granted scopes]
      * }
      */
    }
});
```
Once you have your user's *access token*, you can use it to query any **authenticated** resource the user has (and has granted you) access to.

## Methods

### requestCallback (Callback)

The callback that will handle the response.

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| err | Object | False | In request produces an error, it will be stored in this parameter. null if the request was successful |
| body | Object | False | The body of the response if the request was successful |

### getAuthorizationUrl (Function)

Returns the full URL to witch you must send your user in order to authorize your application

```js
var getauthorizationurl = getAuthorizationUrl();
```

#### Returns

| Name | Type | Description |
| ---- | ---- | ---------- |
| return | String | The the full URL to witch you must send your user for authorization |

### getAccessToken (Function)

Requests Twitch.tv for an accessCode for your authorized user

```js
getAccessToken(code, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| code | String | False | The code that twitch.tv's API sent in the redirection URI parameters when the user authorized your application |
| callback | requestCallback | False | The callback that will manage the response. |

### getBlocks (Function)

Get user's block list

API endpoint: [GET /users/:user/blocks](https://github.com/justintv/Twitch-API/blob/master/v3_resources/blocks.md#get-usersuserblocks)

```js
getBlocks(user, accessToken, [parameters], callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| user | String | False | The user name of wich you want to get the block list, authenticated by accesToken |
| accessToken | String | False | The token representing the authenticated user |
| parameters | Object | True | The parameters of the API endpoint |
| callback | requestCallback | False | The callback that will manage the response. |

### addBlock (Function)

Add target to user's block list

API endpoint: [PUT /users/:user/blocks/:target](https://github.com/justintv/Twitch-API/blob/master/v3_resources/blocks.md#put-usersuserblockstarget)

```js
addBlock(user, accessToken, target, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| user | String | False | The user name of the user |
| accessToken | String | False | The token representing the authenticated user |
| target | String | False | the user name your user wants to block |
| callback | requestCallback | False | The callback that will manage the response. |

### removeBlock (Function)

Delete target from user's block list

API endpoint: [DELETE /users/:user/blocks/:target](https://github.com/justintv/Twitch-API/blob/master/v3_resources/blocks.md#delete-usersuserblockstarget)

```js
removeBlock(user, accessToken, target, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| user | String | False | The user name of the user |
| accessToken | String | False | The token representing the authenticated user |
| target | String | False | the user name your user wants to unblock |
| callback | requestCallback | False | The callback that will manage the response. |

### getChannel (Function)

Returns a channel object.

API endpoint: [GET /channels/:channel/](https://github.com/justintv/Twitch-API/blob/master/v3_resources/channels.md#get-channelschannel)

```js
getChannel(channel, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| channel | String | False | The channel name |
| callback | requestCallback | False | The callback that will manage the response. |

### getAuthenticatedUserChannel (Function)

Returns a channel object of authenticated user. Channel object includes stream key.

API endpoint: [GET /channel](https://github.com/justintv/Twitch-API/blob/master/v3_resources/channels.md#get-channel)

```js
getAuthenticatedUserChannel(accessToken, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| accessToken | String | False | The token representing the authenticated user |
| callback | requestCallback | False | The callback that will manage the response. |

### getChannelEditors (Function)

Returns a list of user objects who are editors of channel. The user should be the owner (maybe editor?) of the channel

API endpoint: [GET /channels/:channel/editors](https://github.com/justintv/Twitch-API/blob/master/v3_resources/channels.md#get-channelschanneleditors)

```js
getChannelEditors(channel, accessToken, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| channel | String | False | The channel name |
| accessToken | String | False | The token representing the authenticated user |
| callback | requestCallback | False | The callback that will manage the response. |

### updateChannel (Function)

Update channel's status or game.

API endpoint: [PUT /channels/:channel/](https://github.com/justintv/Twitch-API/blob/master/v3_resources/channels.md#put-channelschannel)

```js
updateChannel(channel, accessToken, channelOptions, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| channel | String | False | The channel name |
| accessToken | String | False | The token representing the authenticated user |
| channelOptions | Object | False | The options you want to change in JSON format |
| channelOptions.channel | JSON | False | The real options are wrapped here |
| channelOptions.channel.status | String | False | The new status of the channel |
| channelOptions.channel.game | String | False | The new game of the channel |
| channelOptions.channel.delay | Number | False | The delay of the channel |
| callback | requestCallback | False | The callback that will manage the response |

### resetStreamKey (Function)

Resets channel's stream key.

API endpoint: [DELETE /channels/:channel/stream_key](https://github.com/justintv/Twitch-API/blob/master/v3_resources/channels.md#delete-channelschannelstream_key)

```js
resetStreamKey(channel, accessToken, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| channel | String | False | The channel name |
| accessToken | String | False | The token representing the authenticated user |
| callback | requestCallback | False | The callback that will manage the response. |

### startCommercial (Function)

Start commercial on channel.

API endpoint: [POST /channels/:channel/commercial](https://github.com/justintv/Twitch-API/blob/master/v3_resources/channels.md#post-channelschannelcommercial)

```js
startCommercial(channel, accessToken, [parameters], callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| channel | String | False | The channel name |
| accessToken | String | False | The token representing the authenticated user |
| parameters | Object | True | The parameters of the request |
| parameters.length | Number | True | The length of the commercial break in seconds. One of 30, 60, 90, 120, 150 or 180. Defaults to 30. |
| callback | requestCallback | False | The callback that will manage the response |

### getChannelTeams (Function)

Returns a list of team objects channel belongs to.

API endpoint: [GET /channels/:channel/teams](https://github.com/justintv/Twitch-API/blob/master/v3_resources/channels.md#get-channelschannelteams)

```js
getChannelTeams(channel, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| channel | String | False | The channel name |
| callback | requestCallback | False | The callback that will manage the response |

### getChannelChat (Function)

Returns a links object to all other chat endpoints.

API endpoint: [GET /chat/:channel](https://github.com/justintv/Twitch-API/blob/master/v3_resources/chat.md#get-chatchannel)

```js
getChannelChat(channel, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| channel | String | False | The channel name |
| callback | requestCallback | False | The callback that will manage the response |

### getEmoticons (Function)

Returns a list of all emoticon objects for Twitch.

API endpoint: [GET /chat/emoticons](https://github.com/justintv/Twitch-API/blob/master/v3_resources/chat.md#get-chatemoticons)

```js
getEmoticons(callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| callback | requestCallback | False | The callback that will manage the response |

### getChannelBadges (Function)

Returns a list of chat badges that can be used in the channel's chat.

API endpoint: [GET /chat/:channel/badges](https://github.com/justintv/Twitch-API/blob/master/v3_resources/chat.md#get-chatchannelbadges)

```js
getChannelBadges(channel, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| channel | String | False | The channel name |
| callback | requestCallback | False | The callback that will manage the response |

### getChannelFollows (Function)

Returns a list of follow objects.

API endpoint: [GET /channels/:channel/follows](https://github.com/justintv/Twitch-API/blob/master/v3_resources/follows.md#get-channelschannelfollows)

```js
getChannelFollows(channel, [parameters], callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| channel | String | False | The channel name |
| parameters | Object | True | The parameters of the request |
| parameters.limit | Number | True | Maximum number of follow objects. Maximum is 100, defaults to 25 |
| parameters.offset | Number | True | Follow object offset for pagination. Defaults to 0 |
| parameters.direction | String | True | Creation date sorting direction. Defaults to desc. Valid values are asc and desc. |
| callback | requestCallback | False | The callback that will manage the response |

### getUserFollowedChannels (Function)

Returns a list of follow objects

API endpoint: [GET /users/:user/follows/channels](https://github.com/justintv/Twitch-API/blob/master/v3_resources/follows.md#get-usersuserfollowschannels)

```js
getUserFollowedChannels(user, [parameters], callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| user | String | False | The user name |
| parameters | Object | True | The parameters of the request |
| parameters.limit | Number | True | Maximum number of follow objects. Maximum is 100, defaults to 25 |
| parameters.offset | Number | True | Follow object offset for pagination. Defaults to 0 |
| parameters.direction | String | True | Creation date sorting direction. Defaults to desc. Valid values are asc and desc. |
| parameters.sortby | String | True | Sort key. Defaults to created_at. Valid values are created_at, last_broadcast, and login. Defaults to desc. Valid values are asc and desc. |
| callback | requestCallback | False | The callback that will manage the response |

### getUserFollowsChannel (Function)

Returns a follow object if user is following channel, 404 otherwise.

API endpoint: [GET /users/:user/follows/channels/:target](https://github.com/justintv/Twitch-API/blob/master/v3_resources/follows.md#get-usersuserfollowschannelstarget)

```js
getUserFollowsChannel(user, channel, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| user | String | False | The user name |
| channel | String | False | The channel name |
| callback | requestCallback | False | The callback that will manage the response |

### userFollowChannel (Function)

Adds user to channel's followers.

API endpoint: [PUT /users/:user/follows/channels/:target](https://github.com/justintv/Twitch-API/blob/master/v3_resources/follows.md#put-usersuserfollowschannelstarget)

```js
userFollowChannel(user, channel, accessToken, [parameters], callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| user | String | False | The user name |
| channel | String | False | The channel name |
| accessToken | String | False | The token representing the authenticated user |
| parameters | Object | True | The parameters of the request |
| parameters.notifications | boolean | True | Whether user should receive notifications when channel goes live. Defaults to false. |
| callback | requestCallback | False | The callback that will manage the response |

### userUnfollowChannel (Function)

Removes user from channel's followers.

API endpoint: [DELETE /users/:user/follows/channels/:target](https://github.com/justintv/Twitch-API/blob/master/v3_resources/follows.md#delete-usersuserfollowschannelstarget)

```js
userUnfollowChannel(user, channel, accessToken, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| user | String | False | The user name |
| channel | String | False | The channel name |
| accessToken | String | False | The token representing the authenticated user |
| callback | requestCallback | False | The callback that will manage the response |

### getTopGames (Function)

Returns a list of games objects sorted by number of current viewers on Twitch, most popular first.

API endpoint: [GET /games/top](https://github.com/justintv/Twitch-API/blob/master/v3_resources/games.md#get-gamestop)

```js
getTopGames([parameters], callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| parameters | Object | True | The parameters of the request |
| parameters.limit | Number | True | Maximum number of games. Maximum is 100, defaults to 25 |
| parameters.offset | Number | True | Follow object offset for pagination. Defaults to 0 |
| callback | requestCallback | False | The callback that will manage the response |

### getIngests (Function)

Returns a list of ingest objects.

API endpoint: [GET /ingests/](https://github.com/justintv/Twitch-API/blob/master/v3_resources/ingests.md#get-ingests)

```js
getIngests(callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| callback | requestCallback | False | The callback that will manage the response |

### getRoot (Function)

Basic information about the API and authentication status. If you are accessToken is provided, the response includes the status of your token and links to other related resources.

API endpoint: [GET /](https://github.com/justintv/Twitch-API/blob/master/v3_resources/root.md#get-)

```js
getRoot([accessToken], callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| accessToken | String | True | The token representing the authenticated user |
| callback | requestCallback | False | The callback that will manage the response |

### searchChannels (Function)

Returns a list of channel objects matching the search query.

API endpoint: [GET /search/channels](https://github.com/justintv/Twitch-API/blob/master/v3_resources/search.md#get-searchchannels)

```js
searchChannels(parameters, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| parameters | Object | False | The parameters of the request |
| parameters.query | String | False | Search query. The field can also be parameters.q |
| parameters.limit | Number | True | Maximum number of channel objects. Maximum is 100, defaults to 25 |
| parameters.offset | Number | True | Follow object offset for pagination. Defaults to 0 |
| callback | requestCallback | False | The callback that will manage the response |

### searchStreams (Function)

Returns a list of stream objects matching the search query.

API endpoint: [GET /search/streams](https://github.com/justintv/Twitch-API/blob/master/v3_resources/search.md#get-searchstreams)

```js
searchStreams(parameters, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| parameters | Object | False | The parameters of the request |
| parameters.query | String | False | Search query. The field can also be parameters.q |
| parameters.limit | Number | True | Maximum number of stream objects. Maximum is 100, defaults to 25 |
| parameters.offset | Number | True | Follow object offset for pagination. Defaults to 0 |
| parameters.hls | boolean | True | If set to true, only returns streams using HLS. If set to false, only returns streams that are non-HLS. |
| callback | requestCallback | False | The callback that will manage the response |

### searchGames (Function)

Returns a list of game objects matching the search query.

API endpoint: [GET /search/games](https://github.com/justintv/Twitch-API/blob/master/v3_resources/search.md#get-searchgames)

```js
searchGames(parameters, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| parameters | Object | False | The parameters of the request |
| parameters.query | String | False | Search query. The field can also be parameters.q |
| parameters.type | String | False | Only accepts suggest: Suggests a list of games similar to query |
| parameters.live | boolean | True | If true, only returns games that are live on at least one channel. |
| callback | requestCallback | False | The callback that will manage the response |

### getChannelStream (Function)

Returns a stream object if live.

API endpoint: [GET /streams/:channel/](https://github.com/justintv/Twitch-API/blob/master/v3_resources/streams.md#get-streamschannel)

```js
getChannelStream(channel, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| channel | String | False | The channel name |
| callback | requestCallback | False | The callback that will manage the response |

### getStreams (Function)

Returns a list of stream objects that are queried by a number of parameters sorted by number of viewers descending.

API endpoint: [GET /streams](https://github.com/justintv/Twitch-API/blob/master/v3_resources/streams.md#get-streams)

```js
getStreams([parameters], callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| parameters | Object | True | The parameters of the request |
| parameters.game | String | True | Streams categorized under game. |
| parameters.channel | String | True | Streams from a comma separated list of channels. |
| parameters.limit | Number | True | Maximum number of streams. Maximum is 100, defaults to 25 |
| parameters.offset | Number | True | Follow object offset for pagination. Defaults to 0 |
| parameters.client_id | String | True | Only shows streams from applications of client_id. |
| callback | requestCallback | False | The callback that will manage the response |

### getFeaturedStreams (Function)

Returns a list of featured (promoted) stream objects.

API endpoint: [GET /streams/featured](https://github.com/justintv/Twitch-API/blob/master/v3_resources/streams.md#get-streamsfeatured)

```js
getFeaturedStreams([parameters], callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| parameters | Object | True | The parameters of the request |
| parameters.limit | Number | True | Maximum number of streams. Maximum is 100, defaults to 25 |
| parameters.offset | Number | True | Follow object offset for pagination. Defaults to 0 |
| callback | requestCallback | False | The callback that will manage the response |

### getStreamsSummary (Function)

Returns a summary of current streams.

API endpoint: [GET /streams/summary](https://github.com/justintv/Twitch-API/blob/master/v3_resources/streams.md#get-streamssummary)

```js
getStreamsSummary([parameters], callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| parameters | Object | True | The parameters of the request |
| parameters.game | String | True | Streams categorized under game. |
| callback | requestCallback | False | The callback that will manage the response |

### getChannelSubscriptions (Function)

Returns a list of subscription objects sorted by subscription relationship creation date which contain users subscribed to channel.

API endpoint: [GET /channels/:channel/subscriptions](https://github.com/justintv/Twitch-API/blob/master/v3_resources/subscriptions.md#get-channelschannelsubscriptions)

```js
getChannelSubscriptions(channel, accessToken, [parameters]);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| channel | String | False | The channel name |
| accessToken | String | False | The token representing the authenticated user |
| parameters | Object | True | The parameters of the request |
| parameters.limit | Number | True | Maximum number of subscription objects. Maximum is 100, defaults to 25 |
| parameters.offset | Number | True | Follow object offset for pagination. Defaults to 0 |
| parameters.direction | String | True | Creation date sorting direction. Defaults to asc. Valid values are asc and desc. |

### getUserSubscriptionToChannel (Function)

Returns a subscription object which includes the user if that user is subscribed. Requires authentication for channel. The authenticated user must be the owner of the channel

API endpoint: [GET /channels/:channel/subscriptions/:user](https://github.com/justintv/Twitch-API/blob/master/v3_resources/subscriptions.md#get-channelschannelsubscriptionsuser)

```js
getUserSubscriptionToChannel(user, channel, accessToken, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| user | String | False | The user name |
| channel | String | False | The channel name |
| accessToken | String | False | The token representing the authenticated user |
| callback | requestCallback | False | The callback that will manage the response |

### getChannelSubscriptionOfUser (Function)

Returns a channel object that user subscribes to. user must be authenticated by accessToken.

API endpoint: [GET /users/:user/subscriptions/:channel](https://github.com/justintv/Twitch-API/blob/master/v3_resources/subscriptions.md#get-usersusersubscriptionschannel)

```js
getChannelSubscriptionOfUser(user, channel, accessToken, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| user | String | False | The user name |
| channel | String | False | The channel name |
| accessToken | String | False | The token representing the authenticated user |
| callback | requestCallback | False | The callback that will manage the response |

### getTeams (Function)

Returns a list of active teams.

API endpoint: [GET /teams/](https://github.com/justintv/Twitch-API/blob/master/v3_resources/teams.md#get-teams)

```js
getTeams([parameters], callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| parameters | Object | True | The parameters of the request |
| parameters.limit | Number | True | Maximum number of teams. Maximum is 100, defaults to 25 |
| parameters.offset | Number | True | Follow object offset for pagination. Defaults to 0 |
| callback | requestCallback | False | The callback that will manage the response |

### getTeam (Function)

Returns a team object for team.

API endpoint: [GET /teams/:team/](https://github.com/justintv/Twitch-API/blob/master/v3_resources/teams.md#get-teamsteam)

```js
getTeam(team, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| team | String | False | The team name |
| callback | requestCallback | False | The callback that will manage the response |

### getUser (Function)

Returns a user object.

API endpoint: [GET /users/:user](https://github.com/justintv/Twitch-API/blob/master/v3_resources/users.md#get-usersuser)

```js
getUser(user, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| user | String | False | The user name of the user |
| callback | requestCallback | False | The callback that will manage the response. |

### getAuthenticatedUser (Function)

Returns a user object that represents the user authenticated by accessToken
.
API endpoint: [GET /user](https://github.com/justintv/Twitch-API/blob/master/v3_resources/users.md#get-user)

```js
getAuthenticatedUser(accessToken, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| accessToken | String | False | The token representing the authenticated user |
| callback | requestCallback | False | The callback that will manage the response |

### getAuthenticatedUserFollowedStreams (Function)

Returns a list of stream objects that the authenticated user is following.

API endpoint: [GET /streams/followed](https://github.com/justintv/Twitch-API/blob/master/v3_resources/users.md#get-streamsfollowed)

```js
getAuthenticatedUserFollowedStreams(accessToken, [parameters], callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| accessToken | String | False | The token representing the authenticated user |
| parameters | Object | True | The parameters of the request |
| parameters.limit | Number | True | Maximum number of streams. Maximum is 100, defaults to 25 |
| parameters.offset | Number | True | Follow object offset for pagination. Defaults to 0 |
| parameters.stream_type | String | True | Only shows streams from a certain type. Permitted values: all, playlist, live |
| callback | requestCallback | False | The callback that will manage the response |

### getAuthenticatedUserFollowedVideos (Function)

Returns a list of video objects from channels that the authenticated user is following.

API endpoint: [GET /videos/followed](https://github.com/justintv/Twitch-API/blob/master/v3_resources/users.md#get-videosfollowed)

```js
getAuthenticatedUserFollowedVideos(accessToken, [parameters], callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| accessToken | String | False | The token representing the authenticated user |
| parameters | Object | True | The parameters of the request |
| parameters.limit | Number | True | Maximum number of videos. Maximum is 100, defaults to 25 |
| parameters.offset | Number | True | Follow object offset for pagination. Defaults to 0 |
| callback | requestCallback | False | The callback that will manage the response |

### getVideo (Function)

Returns a video object.

API endpoint: [GET /videos/:id](https://github.com/justintv/Twitch-API/blob/master/v3_resources/videos.md#get-videosid)

```js
getVideo(videoId, callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| videoId | String | False | The id of the video |
| callback | requestCallback | False | The callback that will manage the response. |

### getTopVideos (Function)

Returns a list of videos created in a given time period sorted by number of views, most popular first.

API endpoint: [GET /videos/top](https://github.com/justintv/Twitch-API/blob/master/v3_resources/videos.md#get-videostop)

```js
getTopVideos([parameters], callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| parameters | Object | True | The parameters of the request |
| parameters.limit | Number | True | Maximum number of videos. Maximum is 100, defaults to 25 |
| parameters.offset | Number | True | Follow object offset for pagination. Defaults to 0 |
| parameters.game | String | True | Returns only videos from game. |
| parameters.period | String | True | Returns only videos created in time period. Valid values are week, month, or all. Defaults to week. |
| callback | requestCallback | False | The callback that will manage the response |

### getChannelVideos (Function)

Returns a list of videos ordered by time of creation, starting with the most recent from channel.

API endpoint: [GET /channels/:channel/videos](https://github.com/justintv/Twitch-API/blob/master/v3_resources/videos.md#get-channelschannelvideos)

```js
getChannelVideos(channel, [parameters], callback);
```

#### Params

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ---------- |
| channel | String | False | The channel name |
| parameters | Object | True | The parameters of the request |
| parameters.limit | Number | True | Maximum number of videos. Maximum is 100, defaults to 25 |
| parameters.offset | Number | True | Follow object offset for pagination. Defaults to 0 |
| parameters.broadcasts | boolean | True | Returns only broadcasts when true, only highlights when false. Defaults to false. |
| parameters.hls | boolean | True | If set to true, only returns streams using HLS. If set to false, only returns streams that are non-HLS. |
| callback | requestCallback | False | The callback that will manage the response |
