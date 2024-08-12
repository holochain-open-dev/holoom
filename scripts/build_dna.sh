#! /bin/bash
set -e
cd -- "$( dirname -- "$0" )"
cd ..

RUSTFLAGS='' CARGO_TARGET_DIR=target cargo build \
    --release \
    --target wasm32-unknown-unknown \
    --workspace
   # --package 'crates/username_attestation/*'
   # --package 'external_attestation'

hc dna pack workdir
