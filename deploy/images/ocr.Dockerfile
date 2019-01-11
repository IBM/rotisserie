FROM python:3.6-slim

COPY ocr/ocr.py ocr/requirements.txt /
ADD https://s3-api.us-geo.objectstorage.softlayer.net/rotisserie-ml-models/pubg.pb /
ADD https://s3-api.us-geo.objectstorage.softlayer.net/rotisserie-ml-models/fortnite.pb /
ADD https://s3-api.us-geo.objectstorage.softlayer.net/rotisserie-ml-models/blackout.pb /

RUN apt-get update && \
    apt-get -y install gcc ffmpeg && \
    pip install -r requirements.txt && \
    apt-get -y purge gcc && \
    apt-get -y autoremove

EXPOSE 3001

CMD ["python", "ocr.py"]
