FROM node:alpine
USER node
WORKDIR /home/node
ENV NODE_ENV=production
RUN npm i express
COPY index.js ./

ENV PORT=
CMD [ "node", "index.js" ]
