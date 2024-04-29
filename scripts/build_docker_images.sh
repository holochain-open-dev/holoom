#!/bin/bash
cd -- "$( dirname -- "$0" )"
cd ..

rm -rf docker/misc_hc/happ_workdir
cp -r workdir docker/misc_hc/happ_workdir

docker build --target local-services -t game-identity/local-services docker/misc_hc
docker build --target authority-agent-sandbox -t game-identity/authority-agent-sandbox docker/misc_hc
docker build --target holo-dev-server -t game-identity/holo-dev-server docker/misc_hc
