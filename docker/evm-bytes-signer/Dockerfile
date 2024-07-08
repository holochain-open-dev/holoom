FROM node:alpine
USER node
WORKDIR /home/node
ENV NODE_ENV=production
COPY package.json ./package.json
RUN npm i
COPY dist ./dist

ENV HOLOCHAIN_HOST_NAME=
ENV HOLOCHAIN_ADMIN_WS_PORT=
ENV HOLOCHAIN_APP_WS_PORT=
ENV HOLOCHAIN_APP_ID=
ENV EVM_PRIVATE_KEY=

CMD [ "npm", "start" ]
