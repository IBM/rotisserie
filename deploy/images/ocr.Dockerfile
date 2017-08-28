FROM ubuntu:16.04

RUN apt-get update; apt-get install -y tesseract-ocr curl git
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get update && apt-get install nodejs -y

COPY ocr.js /
COPY package.json /
COPY package-lock.json /
RUN npm install

EXPOSE 3001
CMD ["node", "ocr.js"]
