FROM node:alpine

WORKDIR /app

COPY . /app
RUN cd /app && npm install

EXPOSE 8080

CMD [ "node", "app.js" ]
