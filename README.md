# pubgredzone

[![npm version](https://badge.fury.io/js/pubgredzone.svg)](https://badge.fury.io/js/pubgredzone)
[![Build Status](https://travis-ci.org/eggshell/pubgredzone.svg?branch=master)](https://travis-ci.org/eggshell/pubgredzone)
[![Docker Automated build](https://img.shields.io/docker/automated/jrottenberg/ffmpeg.svg)](https://hub.docker.com/r/eggshell/pubgredzone/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[**LIVE NOW**](http://pubgred.zone)

pubgredzone takes the concept of the [red zone](https://en.wikipedia.org/wiki/Red_zone_(gridiron_football))
in American football and applies it to the popular online battle royale game
[PLAYERUNKNOWN'S BATTLEGROUNDS](https://www.playbattlegrounds.com/main.pu). The
idea is to always be viewing the most popular PUBG twitch stream with the least
amount of people alive in-game.

## Installation

You can run your own instance of pubgredzone either for local development
or just pure entertainment. Ubuntu and macOS are the currently supported
platforms.

### Prerequisite Software

The following pieces of software are required to run pubgredzone locally:

* [tesseract-ocr](https://github.com/tesseract-ocr/tesseract)
* [ffmpeg](https://ffmpeg.org/)
* [imagemagick](https://www.imagemagick.org/script/index.php)
* [livestreamer](https://github.com/chrippa/livestreamer)

You can install these dependencies with one of the two following commands,
depending on your os:

* Ubuntu:

```shell
  $ sudo apt-get install tesseract-ocr ffmpeg imagemagick
  $ pip install livestreamer
```

* macOS:

```shell
  $ brew install tesseract ffmpeg imagemagick
  $ pip install livestreamer
```

# Steps

1. [Get an OAuth Token for livestreamer]()
2. [Build the images]()
3. [Deploy locally]()
4. [Deploy using Docker]()
5. [Deploy using Kubernetes]()

## 1. Getting an OAuth Token for Twitch

1. On a machine with a browser installed, run the following:

```shell
  $ livestreamer --twitch-oauth-authenticate
```

2. A browser window will open, and prompt you to authorize livestreamer to use
   your twitch account. Click `Authorize`.

3. Your browser will refresh, and a page saying "SORRY, this page does not exist
   yet" will appear. Ignore this. In your address bar, there will be a callback
   URL with `access_token=<TOKEN>`. This is your OAuth token, copy it down and
   proceed to the next section.

## 2. Build the Images

* Clone the repo and install with npm:

```shell
 $ git clone https://github.com/IBM/pubgredzone.git
 $ cd pubgredzone
 $ npm install .
```

* Build and Push the Docker Image

```shell
$ docker build -t <docker_username>/pubgredzone-ocr -f deploy/images/ocr.Dockerfile
$ docker build -t <docker_username>/pubgredzone-app -f deploy/images/app.Dockerfile
$ docker push <docker_username>/pubgredzone-ocr
$ docker push <docker_username>/pubgredzone-app
```

## 3. Running It Locally

```shell
  $ export token="YOUR_OAUTH_TOKEN"
  $ export OCR_HOST=localhost:3001
```

* Navigate to the `pubgredzone` dir if you aren't there already, and start
  the app:

```shell
  $ node ocr.js 2>&1 >/dev/null &
  $ node app.js
```

Now you can open a browser and navigate to `http://localhost:3000` to watch
pubgredzone.

## 4. Running in a Container

You can also run pubgredzone in a docker container.

* Get an OAuth token using the instructions above, and export it as an
  environment variable:

```shell
  $ export token="YOUR_OAUTH_TOKEN"
```

* Start up the containers:

```shell
  $  docker run -d --name pubgredzone-ocr <docker_username>/pubgredzone-ocr
  $ docker run --name pubgredzone-app --link pubgredzone-ocr:pubgredzone-ocr -p 3000:3000  -e OCR_HOST=pubgredzone-ocr:3001 -e token=$token <docker_username>/pubgredzone-app
```

## 5. Running in Kubernetes

## License

pubgredzone is currently licensed under the [MIT LICENSE](LICENSE).
