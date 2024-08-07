# This single docker file is used to build all images utilised by e2e tests:
# - local-services
# - authority-agent-sandbox
# - holo-dev-server

# base common to all images
FROM ubuntu:latest AS hc-base
RUN apt update && apt install -y wget
RUN wget -nv https://github.com/holochain-identity/holo-dev-server-binaries/releases/download/v0.2.3-network-opts/hc \
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
RUN wget -nv https://github.com/holochain-identity/holo-dev-server-binaries/releases/download/v0.2.3-network-opts/holochain \
    -O /usr/local/bin/holochain
RUN wget -nv https://github.com/holochain-identity/holo-dev-server-binaries/releases/download/v0.2.3-network-opts/lair-keystore \
    -O /usr/local/bin/lair-keystore
RUN wget -nv https://github.com/mikefarah/yq/releases/download/v4.40.7/yq_linux_amd64 \
    -O /usr/local/bin/yq
RUN chmod 755 /usr/local/bin/*
COPY happ_workdir /happ_workdir
COPY prepare_sandbox.sh /prepare_sandbox.sh

ARG NETWORK_SEED=""
ARG HOLOCHAIN_LAIR_PASSWORD=""
ARG HOLOCHAIN_APP_WS_PORT="3335"
RUN bash /prepare_sandbox.sh

COPY run_sandbox.sh /run.sh
RUN chmod +x /run.sh

ENV BOOTSTRAP_SERVER_OVERRIDE=
ENV SIGNAL_SERVER_OVERRIDE=
ENV HOLOCHAIN_ADMIN_WS_PORT=
CMD ["/run.sh"]


# holo-dev-server
FROM authority-agent-sandbox AS holo-dev-server

RUN wget -nv https://github.com/holochain-identity/holo-dev-server-binaries/releases/download/v0.2.3-network-opts/holo-dev-server \
    -O /usr/local/bin/holo-dev-server
RUN chmod 755 /usr/local/bin/holo-dev-server

COPY run_holo_dev_server.sh /run.sh
RUN chmod +x /run.sh

ENV BOOTSTRAP_SERVER=
ENV SIGNAL_SERVER=
ENV ADMIN_WS_PORT_EXPOSED=
ENV ADMIN_WS_PORT_INTERNAL=
ENV APP_WS_PORT_EXPOSED=
ENV APP_WS_PORT_INTERNAL=
CMD ["/run.sh"]
