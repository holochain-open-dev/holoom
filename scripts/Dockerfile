FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y libssl3 libssl-dev ca-certificates libpq-dev
COPY game_identity_rocket_server /usr/local/bin/game_identity_rocket_server
ENTRYPOINT ["/usr/local/bin/game_identity_rocket_server"]
