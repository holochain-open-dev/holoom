# We use ubuntu as it's glibc version is compatible with the prebuilt binaries
FROM ubuntu

RUN apt-get update && apt-get install -y wget

# Install node v20.12.2
ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION v20.12.2
RUN mkdir -p $NVM_DIR && wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
RUN /bin/bash -c "source $NVM_DIR/nvm.sh && nvm install $NODE_VERSION && nvm use --delete-prefix $NODE_VERSION"
ENV NODE_PATH $NVM_DIR/versions/node/$NODE_VERSION/bin
ENV PATH $NODE_PATH:$PATH

# Install prebuilt holochain binaries
RUN wget -nv https://github.com/holochain/holochain/releases/download/holochain-0.4.0-dev.20/hc-x86_64-linux \
    -O /usr/local/bin/hc
RUN wget -nv https://github.com/holochain/holochain/releases/download/holochain-0.4.0-dev.20/holochain-x86_64-linux \
    -O /usr/local/bin/holochain
RUN wget -nv https://github.com/holochain/holochain/releases/download/holochain-0.4.0-dev.20/lair-keystore-x86_64-linux \
    -O /usr/local/bin/lair-keystore
RUN chmod 755 /usr/local/bin/hc /usr/local/bin/holochain /usr/local/bin/lair-keystore

# Install tsx
WORKDIR /home/node
RUN /bin/bash -c "source $NVM_DIR/nvm.sh && npm i tsx"

# Copy the actual server script
COPY ./co2-sensor.ts ./co2-sensor.ts

# So container runs with nvm loaded
SHELL ["/bin/bash", "--login", "-c"]

# The ./packages directory is mounted from the locally built npm workspace. We
# npm install at launch to avoid the need for the package.json to know the 
# latest version or features of the workspace.
CMD npm install ./packages/types ./packages/sandbox; npx tsx ./co2-sensor.ts
