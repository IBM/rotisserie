FROM nginx:1.13-alpine

RUN apk add --no-cache bash

COPY ./conf/nginx.conf /etc/nginx/nginx.conf
USER nginx
COPY ./conf/static-nginx.conf /nginx-sites/pubgredzone-static.template
COPY ./public /pubgredzone-static
USER root
RUN mkdir /var/run/nginx
RUN chown nginx:root /nginx-sites
RUN chown nginx:nginx /var/run/nginx

USER nginx
CMD ["/bin/bash", "-c", "envsubst < /nginx-sites/pubgredzone-static.template > /nginx-sites/pubgredzone-static.conf && nginx"]
