#!/bin/bash
set -e
cd -- "$( dirname -- "$0" )"
cd ..

rm -rf docker/misc_hc/happ_workdir
cp -r workdir docker/misc_hc/happ_workdir

docker build --target local-services -t holoom/local-services docker/misc_hc
docker build --target authority-agent-sandbox -t holoom/authority-agent-sandbox docker/misc_hc
docker build --target holo-dev-server -t holoom/holo-dev-server docker/misc_hc

docker build -t holoom/mock-auth docker/mock-auth
docker build \
    -t holoom/mock-oracle \
    -f docker/mock-oracle/Dockerfile \
    packages/mock-oracle # context

docker build \
    -t holoom/external-id-attestor \
    -f docker/external-id-attestor/Dockerfile \
    packages/external-id-attestor # context

docker build \
    -t holoom/evm-bytes-signer \
    -f docker/evm-bytes-signer/Dockerfile \
    packages/evm-bytes-signer # context

bash scripts/build_rocket_bookworm.sh
