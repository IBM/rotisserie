PUBG Red Zone is a web application created by IBM developer advocates. It features an always-exciting video stream of the extremely popular computer game Player Unknown's Battlegrounds.

PUBG Red Zone(PRZ) is written in Node.js. It uses the express framework to serve http. It has one 'microservice', also in express, that handles optical character recognition(OCR). PRZ is deployed on IBM's kubernetes cloud. PRZ is open source software released under the Apache 2 license.

Program Flow
------------

PUBG Red Zone uses twitch-api-v5(https://www.npmjs.com/package/twitch-api-v5) to request a list of all PUBG streams. It then takes a short recording of each of those streams using livestreamer(https://github.com/chrippa/livestreamer) an open source python project for watching and recording streaming video without a web browser. It uses ffmpeg(https://ffmpeg.org) to clip a single frame out of the longer clip. PUBG Red Zone then uses ImageMagick to crop the screenshot to a small image with only the number of players alive visible. That image is submitted to the OCR microservice which uses Tesseract (https://github.com/tesseract-ocr) to translate the image to a json block containing the number of people alive.

The result of this is PUBG Red Zone emits two json endpoints: /all and /current.

curl -s https://pubgred.zone/current | jq '.'
{
  "stream_name": "nicegametv",
  "alive": 17,
  "stream_url": "https://player.twitch.tv/?channel=nicegametv",
  "updated": "2017-08-24T02:08:13.263Z"
}


Both of these endpoints contain basic data on the streams and including the number of players still alive.

Front-end
--------

The 'switching' part of the applictaion is implemented client side. Simple timed ajax requests to the /all endpoint provide all the data needed to make decisions around switching. The twitch stream itself is embedded using twitch's iframe web player. Users who are not logged in to twitch or don't have paid accounts will be subjected to advertisements. Some twitch streams are flagged as 'mature.' The twitch video player asks the viewer to press an 'ok' dialog accepting that mature content might be part of the stream. To avoid that, PUBG Red Zone filters out mature streams from the pool.


Deployment
----------

The application is packaged in three docker containers. The containers are built by scripts, invoked by a Makefile. One container hosts the main app, one container hosts the ocr service, and one container hosts nginx to serve static assets. A kubernetes manifest is provided to configure the deployment. Each app is deployed as a pod/service. An ingress resource is configured to be a load balancer in front of the services. Several paths are configured behind the ingress resource. A ssl cert from letsencrypt is loaded as a tls secret in kubernetes and attached to the ingress resource. A twitch api token is loaded as a generic kubernetes secret and is attached to the primary node application. Kubernetes rolling upgrades are initiated through the Makefile.

Possible future work
--------------------

* Train and use a deep learning model to do OCR instead of tesseract - this would improve the accuracy of the number of people alive
* Use websockets to communicate with the web frontend  - this would allow the switching event to be sent from the server to the client and so the client could switch right after a game completed instead of waiting for some timer to time out.
