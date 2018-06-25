FROM python:3.6-slim

COPY stream_processor/processor.py stream_processor/requirements.txt /
RUN echo "force-unsafe-io" > /etc/dpkg/dpkg.cfg.d/02apt-speedup && \
    echo "Acquire::http {No-Cache=True;};" > /etc/apt/apt.conf.d/no-cache && \
    echo "deb http://ftp.debian.org/debian jessie-backports main" >> /etc/apt/sources.list && \
    apt-get update && \
    apt-get -y -t jessie-backports install ffmpeg && \
    pip install -r requirements.txt && \
    apt-get -y purge gcc && \
    apt-get -y autoremove

CMD ["python", "processor.py"]
