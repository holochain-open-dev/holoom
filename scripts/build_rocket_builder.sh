#! /bin/bash

# This script isn't used by CI, and instead exists to make running e2e tests 
# locally more convenient. This script need only be run once, and sets up a
# dependency of the build_rocket_bookworm.sh script.

docker build --tag rocket-builder - <<'EOT'
FROM rust:1.75.0-bookworm
RUN apt-get update && apt-get install -y libssl3 libssl-dev build-essential git libpq-dev
RUN wget https://go.dev/dl/go1.21.1.linux-amd64.tar.gz && tar -C /usr/local -xzf go1.21.1.linux-amd64.tar.gz
ENV PATH="${PATH}:/usr/local/go/bin"
RUN export PATH="${PATH}:/usr/local/go/bin"
EOT
