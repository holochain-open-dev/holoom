#! /bin/bash

cd -- "$( dirname -- "$0" )"

RELEASE_DIR=../target/wasm32-unknown-unknown/release
WORK_DIR=../workdir

mv $RELEASE_DIR/username_registry_integrity.wasm $WORK_DIR/
mv $RELEASE_DIR/username_registry_coordinator.wasm $WORK_DIR/
mv $RELEASE_DIR/signer_coordinator.wasm $WORK_DIR/
mv $RELEASE_DIR/ping_coordinator.wasm $WORK_DIR/
