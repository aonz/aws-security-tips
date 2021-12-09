FROM node:16.8
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 80
CMD [ "node", "index.js" ]