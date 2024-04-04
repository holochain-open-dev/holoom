#!/bin/bash
cd -- "$( dirname -- "$0" )"
cd ..

rm -rf docker/happ_workdir
cp -r workdir docker/happ_workdir

docker build --target local-services -t game-identity/local-services docker
docker build --target authority-agent-sandbox -t game-identity/authority-agent-sandbox docker
docker build --target holo-dev-server -t game-identity/holo-dev-server docker
