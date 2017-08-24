FROM node:8-alpine

RUN apk add --no-cache tesseract-ocr curl git nodejs

COPY . /
RUN npm install

ARG token
ENV token=$token

EXPOSE 3001

CMD ["node", "ocr.js"]
