docker build --tag rocket-builder - <<'EOT'
FROM rust:1.75.0-bookworm
RUN apt-get update && apt-get install -y libssl3 libssl-dev build-essential git libpq-dev
RUN wget https://go.dev/dl/go1.21.1.linux-amd64.tar.gz && tar -C /usr/local -xzf go1.21.1.linux-amd64.tar.gz
ENV PATH="${PATH}:/usr/local/go/bin"
RUN export PATH="${PATH}:/usr/local/go/bin"
EOT
