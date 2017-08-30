FROM node:8-alpine

COPY . /
RUN echo http://nl.alpinelinux.org/alpine/edge/testing >> /etc/apk/repositories && \
    apk add --no-cache livestreamer ffmpeg imagemagick git py2-singledispatch && \
    npm install

ARG OCR_HOST
ENV OCR_HOST=$OCR_HOST

ARG token
ENV token=$token

EXPOSE 3000

CMD ["node", "app.js"]
