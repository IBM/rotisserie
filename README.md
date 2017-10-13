# rotisserie

[![npm version](https://badge.fury.io/js/pubgredzone.svg)](https://badge.fury.io/js/pubgredzone)
[![Build Status](https://api.travis-ci.org/IBM/rotisserie.svg?branch=master)](https://travis-ci.org/IBM/rotisserie)
[![Docker Automated build](https://img.shields.io/docker/automated/jrottenberg/ffmpeg.svg)](https://hub.docker.com/r/eggshell/rotisserie/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[**LIVE NOW**](http://pubgred.zone)

rotisserie takes the concept of the [red zone](https://en.wikipedia.org/wiki/Red_zone_(gridiron_football))
in American football and applies it to the popular online battle royale game
[PLAYERUNKNOWN'S BATTLEGROUNDS](https://www.playbattlegrounds.com/main.pu). The
idea is to always be viewing the most popular PUBG twitch stream with the least
amount of people alive in-game.

## Included Component

- [Kubernetes Clusters](https://console.ng.bluemix.net/docs/containers/cs_ov.html#cs_ov)

## Featured Technologies

- [Container Orchestration](https://www.ibm.com/cloud-computing/bluemix/containers)
- [Microservices](https://www.ibm.com/developerworks/community/blogs/5things/entry/5_things_to_know_about_microservices?lang=en)
- [Node.js](https://nodejs.org/)

# Prerequisite

The following pieces of software are required to run rotisserie locally:

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

Create a Kubernetes cluster with either [Minikube](https://kubernetes.io/docs/getting-started-guides/minikube) for local testing, or with [IBM Bluemix Container Service](https://github.com/IBM/container-journey-template/blob/master/README.md) to deploy in cloud. The code here is regularly tested against [Kubernetes Cluster from Bluemix Container Service](https://console.ng.bluemix.net/docs/containers/cs_ov.html#cs_ov) using Travis.

# Steps

1. [Get an OAuth Token for livestreamer](#1-getting-an-oauth-token-for-twitch)
2. [Build the images](#2-build-the-images)
3. [Deploy locally](#3-running-it-locally)
4. [Deploy using Docker](#4-running-in-a-container)
5. [Deploy using Kubernetes](#5-running-in-kubernetes)

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
 $ git clone https://github.com/IBM/rotisserie.git
 $ cd rotisserie
 $ npm install .
```

* Build and Push the Docker Image. You would need to push it if you want to deploy the application in Kubernetes.

```shell
$ docker build -t <docker_username>/rotisserie-ocr -f deploy/images/ocr.Dockerfile .
$ docker build -t <docker_username>/rotisserie-app -f deploy/images/app.Dockerfile .
$ docker push <docker_username>/rotisserie-ocr
$ docker push <docker_username>/rotisserie-app
```

## 3. Running It Locally

* Create an environment variable for your token.

```shell
  $ export token="YOUR_OAUTH_TOKEN"
```

* Create an environment variable for the OCR_HOST. This can be set to localhost:3001
  or the IP address + port of a remote OCR host.

```shell
  $ export OCR_HOST="localhost:3001"
```

* Navigate to the `rotisserie` dir if you aren't there already, and start
  the app:

```shell
  $ node ocr.js 2>&1 >/dev/null &
  $ node app.js
```

Now you can open a browser and navigate to `http://localhost:3000` to watch
rotisserie.

## 4. Running in a Container

You can also run rotisserie in a docker container.

* Get an OAuth token using the instructions above, and export it as an
  environment variable:

```shell
  $ export token="YOUR_OAUTH_TOKEN"
```

* Start up the containers:

```shell
  $ docker run -d -p 3001:3001 --name rotisserie-ocr <docker_username>/rotisserie-ocr
  $ docker run -d --name rotisserie-app --link rotisserie-ocr:rotisserie-ocr -p 3000:3000 -e OCR_HOST=rotisserie-ocr:3001 -e token=$token <docker_username>/rotisserie-app
```

Now you can open a browser and navigate to `http://localhost:3000` to watch
rotisserie.

## 5. Running in Kubernetes

**note**: Ensure your `$OCR_HOST` environment variable is set to the `cluster_public_ip:3001`.

1. Create a Kubernetes Secret for your OAuth token. You will need to encode the data you want in Base64 for the Kubernetes Secret.

```shell
$ echo -n "YOUR_OAUTH_TOKEN" | base64
```

2. Modify the token-secret.yaml file to use your token

```yaml
...
data:
  token: YOUR_OAUTH_TOKEN_IN_BASE64
```

3. Finally, create the Kubernetes Secret.

```shell
$ kubectl create -f token-secret.yaml
```

4. Modify the `rotisserie-app.yaml` and `rotisserie-ocr.yaml` yaml files to use your image.

```yaml
...
    containers:
    - name: rotisserie-app
      image: <docker_username>/rotisserie-app
```

5. Deploy the OCR service then the main application.

```shell
$ kubectl apply -f rotisserie-ocr.yaml
$ kubectl apply -f rotisserie-app.yaml
```

* To access your application. You would need the public IP address of your cluster. If you don't have a load balancer, you can use the Node Port.

```shell
# For clusters provisioned with Bluemix
$ bx cs workers YOUR_CLUSTER_NAME

# For Minikube
$ minikube ip
```

* Now you can go to `http://IP_ADDRESS:30080`

### Production Detail

The production version of rotisserie has slightly different operational procedures. The production kubernetes manifest is located in the deploy directory. It is typically interacted with via the provided Makefile. Major differences between the production rotisserie and the one used in the developer journey are use of ingress controllers in kuberenetes and adding SSL.

To upgrade the site:


```
make roll
```

Note: this depends on you deploying with a unique sha. See the 'make-rev' rule in the Makefile. In most cases ``git pull; make roll`` should work. In cases where a roll failed or the app failed for reasons not connected to the code, a dummy commit might need to be added before re-rolling. Please only roll from master.


## License

rotisserie is currently licensed under the [MIT LICENSE](LICENSE).
