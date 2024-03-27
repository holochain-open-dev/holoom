FROM ubuntu:latest

RUN apt update && apt install -y wget jq socat net-tools

RUN wget https://github.com/holochain-open-dev/holochain-prebuilt-binaries/releases/download/0.2.6/hc-v0.2.6-x86_64-unknown-linux-gnu \
    -O /usr/local/bin/hc
RUN wget https://github.com/holochain-open-dev/holochain-prebuilt-binaries/releases/download/0.2.6/holochain-v0.2.6-x86_64-unknown-linux-gnu \
    -O /usr/local/bin/holochain
RUN wget https://github.com/holochain-open-dev/holochain-prebuilt-binaries/releases/download/0.2.6/lair-keystore-v0.4.2-x86_64-unknown-linux-gnu \
    -O /usr/local/bin/lair-keystore
COPY holo-dev-server-configurable /usr/local/bin/holo-dev-server
RUN chmod 755 /usr/local/bin/*

COPY game_identity_repacked.happ /app.happ

COPY run.sh /run.sh
RUN chmod +x /run.sh

ENV BOOTSTRAP_SERVER=
ENV SIGNAL_SERVER=
CMD ["/run.sh"]
