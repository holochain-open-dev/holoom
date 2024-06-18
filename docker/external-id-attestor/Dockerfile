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
ENV AUTH_TOKEN_ENDPOINT=
ENV AUTH_CLIENT_SECRET=
ENV AUTH_REDIRECT_URI=
ENV AUTH_USER_INFO_ENDPOINT=
ENV AUTH_EXTERNAL_ID_FIELD_NAME=
ENV AUTH_DISPLAY_NAME_FIELD_NAME=

CMD [ "npm", "start" ]