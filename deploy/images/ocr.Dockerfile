FROM node:8-alpine

COPY ocr.js /
COPY package.json /
COPY package-lock.json /
# Once tesseract-ocr-3.05 is availble all of this wget stuff
# can go away. 3.05 includes the english training data while
# 3.04 doesn't. Currently 3.05 can't be installed from edge because
# of broken dependencies.
RUN apk --update --no-cache --virtual wget-deps add ca-certificates openssl && \
    apk --no-cache add tesseract-ocr git && \
    wget -q -P /usr/share/tessdata/ https://github.com/tesseract-ocr/tessdata/raw/master/eng.traineddata && \
    apk del wget-deps && \
    npm install

EXPOSE 3001

CMD ["node", "ocr.js"]
