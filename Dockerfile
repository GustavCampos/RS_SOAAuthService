FROM docker.io/node:lts-slim

RUN apt -y update && apt -y upgrade

COPY . /app

WORKDIR /app

EXPOSE 3000

RUN npm install && node projectSetup.js 

CMD [ "node", "index.js" ]
