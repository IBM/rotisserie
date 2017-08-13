FROM ubuntu:16.04

RUN apt-get update; apt-get install -y tesseract-ocr ffmpeg imagemagick curl git
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get update && apt-get install nodejs
RUN apt-get install -y python-dev python-pip; pip install livestreamer

COPY . /
RUN npm install

ARG token
ENV token=$token

EXPOSE 3000
CMD ["node", "app.js"]
