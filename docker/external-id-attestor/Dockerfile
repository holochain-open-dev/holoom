FROM node:alpine
USER node
WORKDIR /home/node

RUN mkdir holoom-authority
COPY dist ./holoom-authority/dist
COPY package.json ./holoom-authority/package.json
ENV NODE_ENV=production
RUN npm i ./holoom-authority
RUN echo 'import { runExternalIdAttestorFromEnv } from "@holoom/authority";\
    runExternalIdAttestorFromEnv().catch(console.error);\
    ' > index.mjs

ENV HOLOCHAIN_HOST_NAME=
ENV HOLOCHAIN_ADMIN_WS_PORT=
ENV HOLOCHAIN_APP_WS_PORT=
ENV HOLOCHAIN_APP_ID=
ENV AUTH_TOKEN_ENDPOINT=
ENV AUTH_CLIENT_SECRET=
ENV AUTH_REDIRECT_URI=
ENV AUTH_USER_INFO_ENDPOINT=
ENV AUTH_EXTERNAL_ID_FIELD_NAME=
ENV AUTH_DISPLAY_NAME_FIELD_NAME=

CMD [ "node", "index.mjs" ]
