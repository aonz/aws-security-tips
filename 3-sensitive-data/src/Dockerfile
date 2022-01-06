FROM node:16.11.0
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 80
CMD [ "node", "index.js" ]