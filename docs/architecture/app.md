# Rotisserie application architecture

## Overview

The rotisserie application engine is written entirely in node.js, can run directly
on a baremetal or virtual machine, or be run in containers either locally or in
a distributed container orchestration platform such as Kubernetes. Rotisserie
contains both a main app engine and an Object Character Recognition microservice
utilizing tesseract, as well as a web UI for viewing the results of the app in
real time.

The following pieces of this document will document how the Rotisserie app backend,
OCR microservice, and web frontend work together.

## app.js

Most of the heavy lifting on the backend is handled by `app.js`. The following
steps make up the flow of how the "best" stream is chosen, that is the stream
showing the least number of players alive in a game of PlayerUnknown's Battlegrounds:

* Ensure needed filesystem directories.
* Update the list of streams to cycle through on an interval:
    * Authenticate with twitch via their Helix API.
    * Get a list of valid, currently broadcasting PUBG streams.
    * Record a short snippet of raw video footage obtained in the previous step
      and write it to disk.
    * Take a screenshot of each successfully recorded clip of each stream.
    * Crop each screenshot to contain only the number of people alive in the
      game, which is shown at all times while the game is being played.
    * Send each cropped screenshot to the ocr microservice contained in `ocr.js`,
      and receive back a plaintext representation of what is contained in that
      screenshot. If the number cannot be read or the streamer is otherwise not
      currently in-game, that entry is ignored.
    * Place each plaintext representation of the screenshot into an array, along
      with the name of the stream it is associated with.
    * Sort this array by the numbers obtained from the ocr microservice, then
      take the first entry of that array as the "best" stream with the lowest
      number of players alive.
* Take the name of the best stream obtained in the previous step, and refresh
  the currently broadcasted stream in the app client-side in `rotisserie.js`.
* Repeat the above three steps on an interval indefinitely.

### Ensure needed filesystem directories

**node.js libraries used**:
  * `fs`
  * `path`

The function `main()` calls the function `ensureDir()` to have complete confidence
that our needed filesystem paths are present:

`main()`:

```
const clipsDir = "./streams/clips/";
const thumbnailsDir = "./streams/thumbnails/";
const cropsDir = "./streams/crops/";

ensureDir(clipsDir);
ensureDir(thumbnailsDir);
ensureDir(cropsDir);
```

`ensureDir()`:

```
function ensureDir(dirPath) {
  const parts = dirPath.split(path.sep);
  const mkdirSync = function(dirPath) {
    try {
      fs.mkdirSync(dirPath);
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
    }
  };

  for (let i = 1; i <= parts.length; i++) {
    mkdirSync(path.join.apply(null, parts.slice(0, i)));
  }
}
```

These directories are needed to house clips of streams, their associated
single frame screenshots, and their associated cropped screenshots containing
only the number of players alive in-game for each stream.

### Updating the list of valid streams

This is the main event loop which runs on an interval to get stream data and
interpret it into plaintext. It is called once directly by `main()` in order to
initialize the list when rotisserie is started, and then is run on an interval
of 30 seconds indefinitely.

`main()`:

```
// init website with lowest stream.
updateStreamsList(cropsDir);

// continue searching for lowest stream every 30 seconds.
setInterval(function() {
  updateStreamsList(cropsDir);
}, 30000);
```

The following subsections will explain each function called by `updateStreamsList()`.

#### Getting a list of twitch streams

**node.js libraries used**:
  * request

`listStreams()` is a function which makes a request to Twitch's Helix API and
receives a JSON payload of streams and some of their associated metadata. This
response is parsed by `listStreams()` and returned to `updateStreamsList()` for
storage in an array.

`updateStreamsList()`:

```
// get list of twitch streams and record each one
listStreams(function(response) {
  let streamsList = response;
  console.log(streamsList.length);
  let array = [];
  let newAllStreams = [];
  for (let stream in streamsList) {
    let streamName = streamsList[stream];
    const data = {
      streamName: streamName,
      clipsDir: "./streams/clips/",
      thumbnailsDir: "./streams/thumbnails/",
      cropsDir: "./streams/crops/",
    };
```

The `listStreams()` function first sets some variables. 3 of these are gleaned from
environment variables, set either by the user or a Kubernetes configuration:

```
let clientID = process.env.clientID;
let allowlist = process.env.ROTISSERIE_ALLOWLIST;
let blocklist = process.env.ROTISSERIE_BLOCKLIST;
```

`clientID` is a secret obtained from Twitch corresponding to a single account.
The `allowlist` and `blocklist` are lists of streams which the user has deemed
to be fit or unfit for use in rotisserie. If a stream is on the allowlist, it
will always be considered for use in rotisserie. If a stream is on the blocklist,
it will always be blocked from consideration for use in rotisserie. We will talk
about why a stream might be deemed unfit for use later on.

The other two variables set are for interacting with Twitch:

```
let gameURL = "https://api.twitch.tv/kraken/streams?game=PLAYERUNKNOWN'S+BATTLEGROUNDS&language=en&stream_type=live&limit=20";
let options = {
  url: gameURL,
  headers: {
    "Client-ID": clientID,
  },
};
```

`gameURL` tells the Twitch API to only look at streams flagged as currently streaming
PlayerUnknown's Battlegrounds in english language, and to limit the response's
number of streams to 20. We filter by english language streams because if the
game language of PlayerUnknown's BattleGrounds is not set to english, the position
containing the box of number of players alive is shifted.

`options` is an object which sets HTTP headers for use when making requests to
Twitch.

Next, the `listStreams()` function makes a request to Twitch's Helix API using
the node.js `request` library. If Twtich does not respond, returns an error,
or returns a null or undefined response, an error is logged and an empty array
is returned to `updateStreamsList()`. The HTTP response code is also logged to
the console:

```
request(options, function(error, response, body) {
if (body === undefined || body === null) {
  console.log("No response from Twitch.");
  if (error) {
    console.log("  " + error);
  }
  return Array([]);
}
if (error) console.log("error:", error);
console.log("statusCode:", response.statusCode);
```

The response is then parsed and filtered to not include streams which have been
flagged by the streamer as for mature audiences. Rotisserie excludes these streams
because the user has to manually click a button saying they understand the stream
has been flagged, which goes against the design of having an application which
automatically switches between streams.

If a allowlist is defined and there are matches between streams on the allowlist
and streams in the Twitch response, that list eventually becomes the list returned.
If a blocklist is defined and there are matches between streams on the blocklist
and streams in the Twitch response, those streams are excluded from the returned
list. The list of objects is then flitered down to just include display names of
streams. This list is logged to the console and returned to `updateStreamsList()`.

```
bodyJSON = JSON.parse(body);
  allAgesStreams = bodyJSON.streams.filter(function(d) {
    return d.channel.mature === false;
  });
  if (allowlist !== null && allowlist !== undefined) {
    allowlist = allowlist.split(" ");
    allAgesStreams = allAgesStreams.filter(function(d) {
      return allowlist.includes(d.channel.name);
    });
  }
  if (blocklist !== null && blocklist !== undefined) {
    blocklist = blocklist.split(" ");
    allAgesStreams = allAgesStreams.filter(function(d) {
      return !blocklist.includes(d.channel.name);
    });
  }
  usernameList = allAgesStreams.map(function(d) {
    return d.channel["display_name"];
  });
  console.log(usernameList);
  return callback(usernameList);
});
```

### Getting and processing data for each stream

Now that `updateStreamsList()` has a list of valid Twitch streams to inspect,
it will loop through them and perform the following steps for each entry:

  * Record a short piece of footage of the stream
  * Take a single frame screenshot of each piece of footage
  * Crop that screenshot to only include the box containing the number of players
    alive in-game.
  * Send the cropped screenshot to the OCR microservice contained in `ocr.js`.
  * Receive a response from the OCR service containing the number of players
    alive in game.
  * The stream name and number of players alive is pushed to an array, and the
    next iteration takes place until the end of the list.

```
for (let stream in streamsList) {
  let streamName = streamsList[stream];
  const data = {
    streamName: streamName,
    clipsDir: "./streams/clips/",
    thumbnailsDir: "./streams/thumbnails/",
    cropsDir: "./streams/crops/",
  };

  recordStream(data)
    .then(takeScreenshot)
    .then(cropScreenshot)
    .then(ocrCroppedShot)
    .then(function(streamobj) {
      console.log(streamobj.name + " = " + streamobj.alive + " alive.");
      array.push(streamobj);
    }).catch((error) => {
      console.log(error.message);
    });
}
```

#### Recording stream footage

**node.js libraries used**:
  * child_process

**external dependencies used**:
  * livestreamer (pypi package)

`updateStreamsList()` calls `recordStream()`, passing in an object containing
the stream name and path to `clipsDir`, the filesystem directory used to store
stream clips.

`recordStream()` creates a JavaScript promise, which blocks further action on this
stream name until this function has completed in order to avoid continuing to
next steps too early. A message containing the name of the stream being recorded
is logged to the console.

Then, a child process is spawned which runs livestreamer, a python program used
to record footage of twitch streams. Currently, there is no easy solution in
node.js to get this done, which is why livestreamer was chosen. The process
runs for 4 seconds in total, at which point it is killed. This creates a video
file in `clipsDir` named `streamName.mp4` A message indicating that a clip has
been successfully recorded is logged to the console, and the Javascript promise
is resolved.

```
function recordStream(options) {
  return new Promise((resolve, reject) => {
    console.log("recording clip of stream: " + options.streamName);
    const child = spawn("livestreamer", ["--yes-run-as-root", "-Q", "-f",
      "--twitch-oauth-token", process.env.token,
      "twitch.tv/" + options.streamName, "720p", "-o",
      options.clipsDir + options.streamName + ".mp4"]);
    setTimeout(function() {
      child.kill("SIGINT");
      console.log("recorded stream: " + options.streamName);
      resolve(options);
    }, 4000);
  });
}
```

#### Taking a screenshot of a stream clip

**node.js libraries used**:
  * fs
  * fluent_ffmpeg

**external dependencies used**:
  * ffmpeg (system package)

`updateStreamsList()` then calls `takeScreenshot()`, passing in an object containing
the stream name and paths to the filesystem directories `clipsDir` and
`thumbnailsDir`, which are used to store stream footage and their corresponding
thumbnails.

`takeScreenshot()` makes use of the node.js package `fluent_ffmpeg`, a wrapper
around the open source software `ffmpeg` available on many different operating
systems. `ffmpeg` allows rotisserie to take screenshots of a piece of footage
programatically, and is actively maintained enough for us to use it as an
external dependency.

`takeScreenshot()` creates a JavaScript promise, which blocks further action on this
stream name until this function has completed in order to avoid continuing to
next steps too early. A message containing the name of the stream having its
footage screenshotted is logged to the console.

Then, a filesystem check on the clip is performed to ensure `streamName.mp4`
exists in `clipsDir`. If the clip does not exist, the JavaScript promise is
rejected and the function exits. If it does, a message indicating that a screenshot is
being taken of the stream clip is logged to the console. A `fluent_ffmpeg`
object is created and attempts to take a screenshot of the clip passed in to
the contructor at the 0 second mark. If the screenshot is successfully taken,
a file in `thumbnailsDir` named `streamName.png` is created, the JavaScript
promise is resolved and the function returns. If an error occurs while taking the
screenshot, an error message is logged to the console and the promise is rejected.

```
function takeScreenshot(options) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(options.clipsDir + options.streamName + ".mp4")) {
      console.log("taking screenshot of stream: " + options.streamName);
      new FFMpeg(options.clipsDir + options.streamName + ".mp4")
        .takeScreenshots({
          timestamps: [0],
          folder: options.thumbnailsDir,
          filename: options.streamName + ".png",
        })
        .on("end", function() {
          resolve(options);
        })
        .on("error", function(err) {
          fs.unlinkSync(options.clipsDir + options.streamName + ".mp4");
          console.log("Deleted " + options.clipsDir
                        + options.streamName + ".mp4");
          reject(new Error("An error occurred: " + err.message));
        });
    } else {
      reject(new Error("File " + options.clipsDir
        + options.streamName + ".mp4 not found."));
    }
  });
}
```

#### Cropping a screenshot

**node.js libraries used**:
  * fs
  * gm

**external dependencies used**:
  * ImageMagick

`updateStreamsList()` then calls `cropScreenshot()`, passing in an object
containing the stream name, and paths to filesystem directories `thumbnailsDir`
and `cropsDir`, which contain thumbnails and cropped thumbnails for each
stream.

`cropScreenshot()` makes use of `gm`, a node.js wrapper around `GraphicsMagick`
and `ImageMagick`, two pieces of open source software for image modification
and processing available for use on many Linux distributions.

`cropScreenshot()` creates a JavaScript promise, which blocks further action on this
stream name until this function has completed in order to avoid continuing to
next steps too early. A message containing the name of the stream having its
screenshot cropped is logged to the console.

Then, a filesystem check on the screenshot is performed to ensure `streamName.mp4`
exists in `thumbnailsDir`. If the screenshot does not exist, the JavaScript
promise is rejected and the function exits. If it does, a message indicating
that a screenshot is being cropped is logged to the console.

A `gm` object is then instantiated with the full path to the screenshot to be
cropped passed in. This `gm` object then attempts to crop the screenshot down to
just the box containing the number of players alive, convert the cropped image
to grayscale, and write the final image to `streamName.png` in `cropsDir`. If
successful, a message indicating successful cropping is printed to the console,
the JavaScript promise is resolved and the function returns. If an error occurs,
the error message is logged to the console, the JavaScript promise is rejected,
and the function exits.

```
function cropScreenshot(options) {
  return new Promise((resolve, reject) => {
    console.log("cropping screenshot of stream: " + options.streamName);
    if (fs.existsSync(options.thumbnailsDir + options.streamName + ".png")) {
      gm(options.thumbnailsDir + options.streamName + ".png")
        .crop(28, 20, 1190, 25)
        .type("Grayscale")
        .write(options.cropsDir + options.streamName + ".png", function(err) {
          resolve(options);
          if (err) reject(err);
        });
      console.log("cropped screenshot of: " + options.streamName);
    } else {
      reject(new Error(options.streamName + ": input file not found"));
    }
  });
}
```

#### Using the OCR microservice

**node.js libraries used**:
  * fs
  * request

`updateStreamsList()` then calls `ocrCroppedShot()`, passing in an object containing
the stream name, and paths to the filesystem directory `cropsDir`, which contains
cropped thumbnails for each stream. `ocrCroppedShot()` promise, which blocks
further action on this stream name until this function has completed in order
to avoid continuing to next steps too early.

Then, the HTTP form data is constructed by opening a read stream to an image
file in `cropsDir` named `streamName.png`, containing just the number of players
alive for the image's corresponding Twitch stream:

```
function ocrCroppedShot(options) {
  return new Promise((resolve, reject) => {
    let formData = {
      image: fs.createReadStream(__dirname
                                 + options.cropsDir.replace(".", "")
                                 + options.streamName + ".png"),
    };
```

The request contain just the URL to make a request to and the form data created
above. The URL is the ip address of another container within a given Rotisserie
kubernetes cluster, and the port which the ocr microservice is listening on.
We have kubernetes inject these as environment variables, but they can be configured
to run locally or on another machine, depending on how you want Rotisserie to be
deployed.

```
// k8s injects the following variables
// ROTISSERIE_OCR_SERVICE_HOST=10.10.10.65
// ROTISSERIE_OCR_SERVICE_PORT=3001

let requestOptions = {
  url: "http://" + process.env.ROTISSERIE_OCR_SERVICE_HOST + ":" + process.env.ROTISSERIE_OCR_SERVICE_PORT + "/process_pubg",
  formData: formData,
};
```

Now that the request options have been constructed, an HTTP POST request is made
to the OCR microservice contained in `ocr.js`, sending the image to be processed.
The OCR microservice will return a JSON payload containing information about
what was gathered from the image. `ocrCroppedShot()` will parse this returned
payload and construct an object for each stream. This object contains the name
of the stream and the number of players alive determined by the OCR microservice.
This object is passed back to `updateStreamsList()` and the Javascript promise is
resolved. If an error occurs during the HTTP POST request, an error message is
logged to the console and the JavaScript promise is rejected.

```
request.post(requestOptions, function(err, httpResponse, body) {
  if (err) {
    console.error("upload failed");
    reject(err);
  } else {
    let parsed = JSON.parse(body);
    let object = {};
    object.name = options.streamName;
    object.alive = parsed.number;
    resolve(object);
  }
});
```

### Getting and processing data for each stream (part 2)

We should return to the following snippet of `updateStreamsList()`:

```
recordStream(data)
  .then(takeScreenshot)
  .then(cropScreenshot)
  .then(ocrCroppedShot)
  .then(function(streamobj) {
    console.log(streamobj.name + " = " + streamobj.alive + " alive.");
    array.push(streamobj);
  }).catch((error) => {
    console.log(error.message);
  });
```

The above subsections outlined to processes taking place within each of these
function calls. Remember that this event loop takes place for each stream
we pull from Twitch, so as each iteration through the list of streams is hit,
an object containing a stream name and a number of players alive is pushed to
an array.

After this loop is finished, Rotisserie sorts this array in ascending order by
the number `alive` contained within each object corresponding to one index in
the array. If the array is not empty, a message is logged to the console indicating
which stream ended up at the zero index of the array post sort. If the array is
empty, an error message will be logged to the console.

```
setTimeout(function() {
  array.sort(function(a, b) {
    return a.alive - b.alive;
  });
  if (array.length > 0) {
    console.log(array);
    console.log("lowest stream: " + array[0].name);
    currentStream = streamToObject(array[0]);
    for (let idx in array) {
      newAllStreams.push(streamToObject(array[idx]));
    }
    allStreams = newAllStreams;
  } else {
    console.log("Empty array, not switching");
  }
}, 25000);
```

A function call to `streamToObject()` is made, which handles updating the global
list `currentStream`. This global list is referred to by the Express JavaScript
web framework in main.

```
function streamToObject(stream) {
  object = {};
  object["stream_name"] = stream.name;
  object["alive"] = stream.alive;
  object["stream_url"] = "https://player.twitch.tv/?channel=" + stream.name;
  object["updated"] = (new Date()).toJSON();
  return object;
}
```

## Front End

**node.js libraries used**:
  * express

Rotisserie uses express.js as its web framework to serve up both a UI to view
the project at work, as well as expose a few API endpoints for viewing what
the current stream is and the list of all the streams Rotisserie is looking at.

`main()`:
```
// serve index.html
  app.get("/", function(req, res) {
    res.sendFile(__dirname + "/public/index.html");
  });

  // serve current leader stream object
  app.get("/current", function(req, res) {
    res.json(currentStream);
  });

  // serve all stream objects
  app.get("/all", function(req, res) {
    res.json(allStreams);
  });
```

HTTP requests can be made to any of the three above endpoints. The rest of the
express code is boilerplate:

```
app.use(express.static("public"));

// start http server and log success
app.listen(3000, function() {
  console.log("Example app listening on port 3000!");
});
```
