#!/bin/bash
set -e
#rm -rf $HOME/.cache

cd -- "$( dirname -- "$0" )"
cd ..
cd ..
echo "$(pwd)"
rm -rf tests/authority_agent/happ_workdir
cp -r workdir tests/authority_agent/happ_workdir

docker build --target local-services -t holoom/local-services tests/authority_agent
docker build --target authority-agent-sandbox -t holoom/authority-agent-sandbox tests/authority_agent
