FROM node:8-alpine

RUN echo http://nl.alpinelinux.org/alpine/edge/testing >> /etc/apk/repositories

RUN apk add --no-cache livestreamer ffmpeg imagemagick curl git py2-singledispatch

COPY . /
RUN npm install

ARG OCR_HOST
ENV OCR_HOST=$OCR_HOST

ARG token
ENV token=$token

EXPOSE 3000

CMD ["node", "app.js"]
