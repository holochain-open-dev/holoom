FROM ubuntu:latest

RUN apt update && apt install -y wget jq socat net-tools

RUN wget https://github.com/holochain-open-dev/holochain-prebuilt-binaries/releases/download/0.2.6/hc-v0.2.6-x86_64-unknown-linux-gnu \
    -O /usr/local/bin/hc

RUN chmod 755 /usr/local/bin/*

COPY run.sh /run.sh
RUN chmod +x /run.sh

ENV BOOTSTRAP_PORT=
ENV SIGNAL_PORT=

