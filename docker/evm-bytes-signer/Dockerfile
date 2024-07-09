FROM node:alpine
USER node
WORKDIR /home/node

RUN mkdir holoom-authority
COPY dist ./holoom-authority/dist
COPY package.json ./holoom-authority/package.json
ENV NODE_ENV=production
RUN npm i ./holoom-authority
RUN echo 'import { runEvmBytesSignerFromEnv } from "@holoom/authority";\
    runEvmBytesSignerFromEnv().catch(console.error);\
    ' > index.mjs

ENV HOLOCHAIN_HOST_NAME=
ENV HOLOCHAIN_ADMIN_WS_PORT=
ENV HOLOCHAIN_APP_WS_PORT=
ENV HOLOCHAIN_APP_ID=
ENV EVM_PRIVATE_KEY=

CMD [ "node", "index.mjs" ]
