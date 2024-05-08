FROM node:alpine

WORKDIR /app
CMD [ "node", "app.js" ]

EXPOSE 8080

COPY package* /app
RUN cd /app && npm install

COPY app.js /app