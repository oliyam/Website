FROM node:latest

COPY bin/package.json .
COPY bin/package-lock.json .

RUN npm install

COPY bin .

EXPOSE 80

CMD [ "node", "app.js" ]