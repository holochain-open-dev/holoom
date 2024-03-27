#! /bin/bash

socat TCP-LISTEN:24274,fork TCP:localhost:24275 &
RUST_BACKTRACE=1 holo-dev-server -p 24275 --bootstrap-server $BOOTSTRAP_SERVER --signal-server $SIGNAL_SERVER /app.happ

