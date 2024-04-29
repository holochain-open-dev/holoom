#! /bin/bash
cd -- "$( dirname -- "$0" )"

cd ..
PROJ_DIR=$(pwd)
CACHE_DIR=$HOME/.cache
DOCKER_HOST_TARGET=$CACHE_DIR/game_identity_target_bookworm
DOCKER_HOST_CARGO_HOME=$CACHE_DIR/bookworm_cargo_home
BUILDER_ID_DIR=$CACHE_DIR/rocket-builder-id
CONTAINER_CARGO_HOME=/usr/local/cargo/
CONTAINER_TARGET=/target


if ! [ -d $DOCKER_HOST_CARGO_HOME ]; then
    echo "Copying cargo home..."
    id=$(docker create rocket-builder)
    mkdir -p $HOME/.cache/
    docker cp $id:$CONTAINER_CARGO_HOME $DOCKER_HOST_CARGO_HOME
    docker rm $id
fi

if ! [ -f $BUILDER_ID_DIR ]; then
    echo "Creating builder container..."
    docker create -i -t \
        -v "$PROJ_DIR:/proj" \
        -v "$DOCKER_HOST_CARGO_HOME:$CONTAINER_CARGO_HOME" \
        -v "$DOCKER_HOST_TARGET:$CONTAINER_TARGET" \
        -w /proj \
        rocket-builder > $BUILDER_ID_DIR
fi

id=$(head -n 1 $BUILDER_ID_DIR)
docker start $id
echo "Starting build..."
docker exec $id bash -c \
    "CARGO_TARGET_DIR=/target cargo build --release --package game_identity_rocket_server"

echo "Copying built binary to docker context..."
cp $DOCKER_HOST_TARGET/release/game_identity_rocket_server $PROJ_DIR/docker/rocket/
