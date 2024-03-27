#! /bin/bash

# Make sure that we're running within the authority_agent_sandbox directory
cd -- "$( dirname -- "$0" )"

# Build and copy the happ
npm run build:happ



echo "Building Authority Agent Sandbox..."

cd docker/authority-agent-sandbox
cp ../../workdir/game_identity.happ ./
docker build -t game-identity-authority-agent-sandbox .

# Create temp docker container to extract repacked happ and vars
id=$(docker create game-identity-authority-agent-sandbox)
docker cp $id:/prebuilt_sandbox/repacked.happ ./game_identity_repacked.happ
docker cp $id:/prebuilt_sandbox/.env ./sandbox_vars
docker rm -v $id

# Add a label layer to the build
source ./sandbox_vars
echo "
FROM $IMAGE_NAME
LABEL authority="$HOLOCHAIN_AGENT_PUBKEY"
" | docker build -t $IMAGE_NAME -



echo "Building holo-dev-server counterpart..."

cd ../holo-dev-server
mv ../authority-agent-sandbox/game_identity_repacked.happ ./
docker build -t game-identity-holo-dev-server .


echo "Building Local Services..."

cd ../local-services
docker build -t game-identity-local-services .

