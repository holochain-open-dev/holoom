#!/bin/bash
set -e
cd -- "$( dirname -- "$0" )"
cd ..

rm -rf docker/misc_hc/happ_workdir
cp -r workdir docker/misc_hc/happ_workdir

docker build --target local-services -t holoom/local-services docker/misc_hc
docker build --target authority-agent-sandbox -t holoom/authority-agent-sandbox docker/misc_hc
docker build --target holo-dev-server -t holoom/holo-dev-server docker/misc_hc

docker build \
    -t holoom/external-id-attestor \
    -f docker/external-id-attestor/Dockerfile \
    packages/external-id-attestor # context

bash scripts/build_rocket_bookworm.sh
