#! /bin/bash

# Make sure that we're running within the authority_agent_sandbox directory
cd -- "$( dirname -- "$0" )"

IMAGE_NAME="authority-agent-sandbox"

# Build and copy the happ
npm run build:happ
cp ../workdir/game_identity.happ ./docker/
docker build -t $IMAGE_NAME ./docker

# Create temp docker container to extract repacked happ and vars
id=$(docker create $IMAGE_NAME)
docker cp $id:/prebuilt_sandbox/repacked.happ ./game_identity_repacked.happ
docker cp $id:/prebuilt_sandbox/.env ./sandbox_vars
docker rm -v $id

# Add a label layer to the build
source ./sandbox_vars
echo "
FROM $IMAGE_NAME
LABEL authority="$HOLOCHAIN_AGENT_PUBKEY"
" | docker build -t $IMAGE_NAME -
