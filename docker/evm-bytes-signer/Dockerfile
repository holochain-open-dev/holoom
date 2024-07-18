FROM node:alpine
USER node
WORKDIR /home/node

RUN mkdir holoom-types
COPY types/dist ./holoom-types/dist
COPY types/package.json ./holoom-types/package.json

RUN mkdir holoom-authority
COPY authority/dist ./holoom-authority/dist
COPY authority/package.json ./holoom-authority/package.json

ENV NODE_ENV=production
RUN npm i ./holoom-types ./holoom-authority
RUN echo 'import { runEvmBytesSignerFromEnv } from "@holoom/authority";\
    runEvmBytesSignerFromEnv().catch(console.error);\
    ' > index.mjs

ENV HOLOCHAIN_HOST_NAME=
ENV HOLOCHAIN_ADMIN_WS_PORT=
ENV HOLOCHAIN_APP_WS_PORT=
ENV HOLOCHAIN_APP_ID=
ENV EVM_PRIVATE_KEY=
ENV ADMIN_TOKEN=

CMD [ "node", "index.mjs" ]
