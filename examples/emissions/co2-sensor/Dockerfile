FROM ubuntu

RUN apt-get update && apt-get install -y wget

ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION v20.12.2
RUN mkdir -p /usr/local/nvm && apt-get update && echo "y" | apt-get install curl
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
RUN /bin/bash -c "source $NVM_DIR/nvm.sh && nvm install $NODE_VERSION && nvm use --delete-prefix $NODE_VERSION"
ENV NODE_PATH $NVM_DIR/versions/node/$NODE_VERSION/bin
ENV PATH $NODE_PATH:$PATH

RUN wget -nv https://github.com/holochain/holochain/releases/download/holochain-0.4.0-dev.20/hc-x86_64-linux \
    -O /usr/local/bin/hc
RUN wget -nv https://github.com/holochain/holochain/releases/download/holochain-0.4.0-dev.20/holochain-x86_64-linux \
    -O /usr/local/bin/holochain
RUN wget -nv https://github.com/holochain/holochain/releases/download/holochain-0.4.0-dev.20/lair-keystore-x86_64-linux \
    -O /usr/local/bin/lair-keystore
RUN chmod 755 /usr/local/bin/hc /usr/local/bin/holochain /usr/local/bin/lair-keystore

WORKDIR /home/node
COPY ./package.json ./package.json
COPY ./co2-sensor.ts ./co2-sensor.ts

SHELL ["/bin/bash", "--login", "-c"]
CMD npm install ./packages/types ./packages/sandbox; npm start
