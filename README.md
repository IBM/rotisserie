# rotisserie

[![Build Status](https://api.travis-ci.org/IBM/rotisserie.svg?branch=master)](https://travis-ci.org/IBM/rotisserie)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

*Read this in other languages: [中国](README-cn.md).*

[**LIVE NOW**](http://rotisserie.tv)

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
2. [Setting up Environment Variables](#2-setting-up-environment-variables)
3. [Build the images](#3-build-the-images)
4. [Deploy locally](#4-running-it-locally)
5. [Deploy using Docker](#5-running-in-a-container)
6. [Deploy using Kubernetes](#6-running-in-kubernetes)

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

## 2. Setting up Environment Variables

* Create an environment variable for your docker username.

```shell
  $ export docker_username="YOUR_DOCKER_USERNAME"
```

* Create an enviornment variable for your token you retrieved in the previous step.

```shell
  $ export token="YOUR_OAUTH_TOKEN"
```

* Create an environment variable for your clientID.

*You must create an app in your Twitch account using the developer mode (https://dev.twitch.tv/) to retrieve the clientID*

```shell
  $ export clientID="YOUR_CLIENT_ID"
```

* Create an environment variable for the ROTISSERIE_OCR_SERVICE_HOST and ROTISSERIE_OCR_SERVICE_PORT. This can be set to ``localhost`` and ``3001``
  if running locally, or the IP address and port of a remote OCR host if running in containers. Mimic the environment variables exported by kubernetes.

```shell
  $ export ROTISSERIE_OCR_SERVICE_HOST="localhost"
  $ export ROTISSERIE_OCR_SERVICE_PORT="3001"
```

## 3. Build the Images

* Clone the repo.

```shell
 $ git clone https://github.com/IBM/rotisserie.git
 $ cd rotisserie
```

* Build and Push the Docker Image. You would need to push it if you want to deploy the application in Kubernetes.

```shell
$ docker build -t $docker_username/rotisserie-ocr -f deploy/images/ocr.Dockerfile .
$ docker build -t $docker_username/rotisserie-app -f deploy/images/app.Dockerfile .
$ docker push $docker_username/rotisserie-ocr
$ docker push $docker_username/rotisserie-app
```

## 4. Running It Locally

* Install with npm.

```shell
  $ npm install .
```

* Navigate to the `rotisserie` dir if you aren't there already, and start
  the app:

```shell
  $ node ocr.js 2>&1 >/dev/null &
  $ node app.js
```

Now you can open a browser and navigate to `http://localhost:3000` to watch
rotisserie.

## 5. Running in a Container

You can also run rotisserie in a docker container.

* Start up the containers:

```shell
  $ docker run -d -p 3001:3001 --name rotisserie-ocr $docker_username/rotisserie-ocr
  $ docker run -d -p 3000:3000 --name rotisserie-app -e ROTISSERIE_OCR_SERVICE_HOST=$ROTISSERIE_OCR_SERVICE_HOST -e ROTISSERIE_OCR_SERVICE_PORT=$ROTISSERIE_OCR_SERVICE_PORT -e token=$token -e clientID=$clientID $docker_username/rotisserie-app
```

Now you can open a browser and navigate to `http://localhost:3000` to watch
rotisserie.

## 6. Running in Kubernetes

**note**: Ensure your `$OCR_HOST` environment variable is set to the `cluster_public_ip:3001`.

1. Create a Kubernetes Secret for your OAuth token. You will need to encode the data you want in Base64 for the Kubernetes Secret.

```shell
$ echo -n "YOUR_OAUTH_TOKEN" | base64
```

2. Modify the rotisserie-secrets.yaml file to use your token

```yaml
...
data:
  token: YOUR_OAUTH_TOKEN_IN_BASE64
```

3. Finally, create the Kubernetes Secret.

```shell
$ kubectl create -f rotisserie-secrets.yaml
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

The production version of rotisserie has slightly different operational procedures. The production kubernetes manifest is located in the deploy directory. It is typically interacted with via the provided Makefile. Major differences between the production rotisserie and the one used in the developer journey are use of ingress controllers in kuberenetes and adding Letsencrypt.

There are a few commands we can use to work with the deployment.

To deploy without letsencrypt use make roll
```
make roll
```

To deploy with letsencrypt use make full-roll
```
make full-roll
```

To redeploy the deployments, without removing svc/ing/other, use make redeploy
```
make redeploy
```

To delete the entire deployment we can use make purge
```
make purge
```

Note: this depends on you deploying with a unique sha. See the 'make-rev' rule in the Makefile. In most cases ``git pull; make roll`` should work. In cases where a roll failed or the app failed for reasons not connected to the code, a dummy commit might need to be added before re-rolling. Please only roll from master.

## Whitelisting and Blacklisting streamers
To whitelist simply set an environment variable called `ROTISSERIE_WHITELIST` to a string with space separated usernames. Same with blacklisting, but with the environment variable `ROTISSERIE_BLACKLIST`.


## License

This code pattern is licensed under the Apache Software License, Version 2.  Separate third party code objects invoked within this code pattern are licensed by their respective providers pursuant to their own separate licenses. Contributions are subject to the [Developer Certificate of Origin, Version 1.1 (DCO)](https://developercertificate.org/) and the [Apache Software License, Version 2](http://www.apache.org/licenses/LICENSE-2.0.txt).

[Apache Software License (ASL) FAQ](http://www.apache.org/foundation/license-faq.html#WhatDoesItMEAN)
