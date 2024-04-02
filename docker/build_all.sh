#! /bin/bash

# Make sure that we're running within the docker directory
cd -- "$( dirname -- "$0" )"

echo "Building shared base image..."
cd ./hc-base
docker buildx build \
    -t localhost:5000/game-identity/hc-base \
    --load \
    --cache-to type=gha \
    --cache-from type=gha .

# echo "Building happ..."
# cd ../..
# npm run build:happ

# echo "Building Authority Agent Sandbox..."
# cd ./docker/authority-agent-sandbox
# cp ../../workdir/game_identity.happ ./
# docker buildx build \
#     -t game-identity-authority-agent-sandbox \
#     --load \
#     --cache-to type=gha \
#     --cache-from type=gha .
# # Create temp docker container to extract repacked happ
# id=$(docker create game-identity-authority-agent-sandbox)
# docker cp $id:/prebuilt_sandbox/repacked.happ ./game_identity_repacked.happ
# docker rm -v $id

# echo "Building holo-dev-server counterpart..."
# cd ../holo-dev-server
# mv ../authority-agent-sandbox/game_identity_repacked.happ ./
# docker buildx build \
#     -t game-identity-holo-dev-server \
#     --load \
#     --cache-to type=gha \
#     --cache-from type=gha .

echo "Building Local Services..."
cd ../local-services
docker buildx build \
    -t localhost:5000/game-identity/local-services \
    --load \
    --cache-to type=gha \
    --cache-from type=gha .

