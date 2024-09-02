#! /bin/bash
set -e
cd -- "$( dirname -- "$0" )"
cd ..

RUSTFLAGS='' CARGO_TARGET_DIR=target cargo build \
    --release \
    --target wasm32-unknown-unknown \
    --package '*_integrity' \
    --package '*_coordinator'

hc app pack --recursive workdir
