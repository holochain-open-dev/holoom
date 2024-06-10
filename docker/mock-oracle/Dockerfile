FROM node:alpine
USER node
WORKDIR /home/node
COPY dist ./dist
COPY package.json .
ENV NODE_ENV=production
RUN npm i

ENV PORT=
ENV HOLOCHAIN_HOST_NAME=
ENV HOLOCHAIN_ADMIN_WS_PORT=
ENV HOLOCHAIN_APP_WS_PORT=
ENV HOLOCHAIN_APP_ID=
CMD [ "npm", "start" ]
