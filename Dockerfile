FROM node:alpine

RUN npm install

EXPOSE 8080

CMD [ "node", "app.js" ]
