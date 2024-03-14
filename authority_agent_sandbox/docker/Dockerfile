FROM ubuntu:latest

RUN apt update && apt install -y wget jq socat net-tools

RUN wget https://github.com/holochain-open-dev/holochain-prebuilt-binaries/releases/download/0.2.6/hc-v0.2.6-x86_64-unknown-linux-gnu \
    -O /usr/local/bin/hc
RUN wget https://github.com/holochain-open-dev/holochain-prebuilt-binaries/releases/download/0.2.6/holochain-v0.2.6-x86_64-unknown-linux-gnu \
    -O /usr/local/bin/holochain
RUN wget https://github.com/holochain-open-dev/holochain-prebuilt-binaries/releases/download/0.2.6/lair-keystore-v0.4.2-x86_64-unknown-linux-gnu \
    -O /usr/local/bin/lair-keystore
RUN wget https://github.com/mikefarah/yq/releases/download/v4.40.7/yq_linux_amd64 \
    -O /usr/local/bin/yq
RUN chmod 755 /usr/local/bin/*

COPY game_identity.happ /game_identity.happ
COPY prepare_sandbox.sh /prepare_sandbox.sh

ARG NETWORK_SEED=""
ARG HOLOCHAIN_LAIR_PASSWORD=""
RUN bash /prepare_sandbox.sh

COPY run.sh /run.sh
RUN chmod +x /run.sh

CMD ["/run.sh"]
