FROM game-identity-hc-base

RUN wget https://github.com/holochain-identity/holo-dev-server-binaries/releases/download/v0.1.0-network-opts/holo-dev-server \
    -O /usr/local/bin/holo-dev-server
RUN chmod 755 /usr/local/bin/holo-dev-server

COPY game_identity_repacked.happ /app.happ

COPY run.sh /run.sh
RUN chmod +x /run.sh

ENV BOOTSTRAP_SERVER=
ENV SIGNAL_SERVER=
CMD ["/run.sh"]
