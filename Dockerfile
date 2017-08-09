FROM node:8.2.1-wheezy

RUN apt-get update; apt-get install -y tesseract-ocr ffmpeg imagemagick

RUN apt-get install -y python-dev python-pip; pip install livestreamer

COPY . /

RUN npm install
