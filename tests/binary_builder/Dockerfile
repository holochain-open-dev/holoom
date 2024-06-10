# Use an official Rust runtime as a parent image
FROM rust:alpine3.20

# Create a new empty shell project
#RUN USER=root cargo new --bin client
WORKDIR /output

#install build dependencies
RUN apt update
#RUN apt-get -y install protobuf-compiler

RUN cargo install --version 0.4.2 lair_keystore
RUN LAIR_PATH=$(which lair-keystore)
RUN cp $LAIR_PATH /output/lair-keystore-v0.4.2-arm64-linux

RUN cargo install holochain --version 0.2.8 --locked --features sqlite-encrypted
RUN HOLOCHAIN_PATH=$(which holochain)
RUN cp $HOLOCHAIN_PATH /output/holochain-v0.2.8-arm64-linux



# Copy our manifests
COPY . .
#COPY ./Cargo.toml ./Cargo.lock ./src/client/* ./

# This build step will cache your dependencies
RUN cargo build --release
RUN rm src/*.rs

# Now that the dependencies are built, copy your source code
COPY ./src ./src

# Build for release.
RUN rm ./target/release/deps/client*
RUN cargo build --bin client --release

# Final base
FROM debian:bookworm-slim

# Copy the build artifact from the build stage
COPY --from=builder /client/target/release/client .

# Set the startup command to run your binary
CMD ["./client"]