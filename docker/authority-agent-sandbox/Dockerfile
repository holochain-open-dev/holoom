FROM game-identity-hc-base

RUN wget https://github.com/mikefarah/yq/releases/download/v4.40.7/yq_linux_amd64 \
    -O /usr/local/bin/yq
RUN chmod 755 /usr/local/bin/yq

COPY game_identity.happ /game_identity.happ
COPY prepare_sandbox.sh /prepare_sandbox.sh

ARG NETWORK_SEED=""
ARG HOLOCHAIN_LAIR_PASSWORD=""
RUN bash /prepare_sandbox.sh

COPY run.sh /run.sh
RUN chmod +x /run.sh

ENV BOOTSTRAP_SERVER_OVERRIDE=
ENV SIGNAL_SERVER_OVERRIDE=
CMD ["/run.sh"]
