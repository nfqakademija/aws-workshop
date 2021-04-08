FROM php:8.0.3-cli-alpine3.13

RUN apk add --update --no-cache autoconf g++ libtool make pcre-dev yaml-dev \
    && pecl install yaml \
    && docker-php-ext-enable yaml \
    && apk del autoconf g++ libtool make pcre-dev

VOLUME "/data"
