# pubgredzone

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

### Installing pubgredzone

* Clone the repo and install with npm:

```shell
  $ git clone git@github.com:eggshell/pubgredzone.git
  $ cd pubgredzone
  $ npm install .
```

### Running It Locally

* [Get an oauth token from twitch](https://dev.twitch.tv/docs/v5/guides/authentication/#getting-tokens).
  Once obtained, export your token as an environment variable:

```shell
  $ export token="YOUR_OAUTH_TOKEN"
```

* Navigate to the `pubgredzone` dir if you aren't there already, and start
  the app:

```shell
  $ node app.js
```

Now you can open a browser and navigate to `http://localhost:3000` to watch
pubgredzone.

## Running in a Container

You can also run pubgredzone in a docker container.

* Clone the repo:

```shell
  $ git clone git@github.com:eggshell/pubgredzone.git
```

* [Get an oauth token from twitch](https://dev.twitch.tv/docs/v5/guides/authentication/#getting-tokens).
  Once obtained, export your token as an environment variable:

```shell
  $ export token="YOUR_OAUTH_TOKEN"
```

* Build the docker image:

```shell
  $ cd pubgredzone
  $ docker build -t "pubgredzone:latest" --build-arg token=$token .
```

* Start up the container:

```shell
  $ docker run pubgredzone
```

## License

pubgredzone is currently licensed under the [MIT LICENSE](LICENSE).
