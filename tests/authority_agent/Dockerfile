# This single docker file is used to build all images utilised by e2e tests:
# - local-services
# - authority-agent-sandbox

# base common to all images
FROM --platform=linux/amd64 ubuntu:latest AS hc-base
RUN apt update && apt install -y wget
RUN wget -nv https://github.com/holochain-open-dev/holochain-prebuilt-binaries/releases/download/0.2.6/hc-v0.2.6-x86_64-unknown-linux-gnu \
    -O /usr/local/bin/hc
RUN chmod 755 /usr/local/bin/hc


# local-services
FROM hc-base AS local-services

ENV BOOTSTRAP_PORT=
ENV SIGNAL_PORT=
COPY run_local_services.sh /run.sh
RUN chmod +x /run.sh
CMD ["/run.sh"]

# authority-agent-sandbox
FROM hc-base AS authority-agent-sandbox

RUN apt install -y jq socat net-tools
RUN wget -nv https://github.com/holochain-open-dev/holochain-prebuilt-binaries/releases/download/0.2.6/holochain-v0.2.6-x86_64-unknown-linux-gnu \
    -O /usr/local/bin/holochain
RUN wget -nv https://github.com/holochain-open-dev/holochain-prebuilt-binaries/releases/download/0.2.6/lair-keystore-v0.4.2-x86_64-unknown-linux-gnu \
    -O /usr/local/bin/lair-keystore
RUN wget -nv https://github.com/mikefarah/yq/releases/download/v4.40.7/yq_linux_amd64 \
    -O /usr/local/bin/yq
# RUN wget -nv https://github.com/mikefarah/yq/releases/download/v4.40.7/yq_darwin_arm64 \
#-O /usr/local/bin/yq
#COPY binaries/holochain /usr/local/bin/holochain
#COPY binaries/lair-keystore /usr/local/bin/lair-keystore
RUN chmod 755 /usr/local/bin/*
COPY happ_workdir /happ_workdir
COPY prepare_sandbox.sh /prepare_sandbox.sh

ARG NETWORK_SEED=""
ARG HOLOCHAIN_LAIR_PASSWORD=""
ARG HOLOCHAIN_APP_WS_PORT="3335"
ARG APP_WS_PORT_EXPOSED="3336"
ARG APP_WS_PORT_INTERNAL="3335"
RUN bash /prepare_sandbox.sh

COPY run_sandbox.sh /run.sh
RUN chmod +x /run.sh

ENV BOOTSTRAP_SERVER_OVERRIDE=
ENV SIGNAL_SERVER_OVERRIDE=
ENV HOLOCHAIN_ADMIN_WS_PORT=
#EXPOSE 3336
CMD ["/run.sh"]

