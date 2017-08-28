FROM ubuntu:16.04

RUN apt-get update; apt-get install -y ffmpeg imagemagick curl git
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get update && apt-get install nodejs -y
RUN apt-get install -y python-dev python-pip; pip install livestreamer

COPY app.js /
COPY package.json /
COPY package-lock.json /
COPY public /public
RUN npm install

EXPOSE 3000
CMD ["node", "app.js"]
