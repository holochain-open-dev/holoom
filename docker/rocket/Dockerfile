FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y libssl3 libssl-dev ca-certificates libpq-dev
COPY holoom_rocket_server /usr/local/bin/holoom_rocket_server
RUN chmod +x /usr/local/bin/holoom_rocket_server
ENTRYPOINT ["/usr/local/bin/holoom_rocket_server"]
