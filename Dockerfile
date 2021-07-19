FROM node:12.6.0
WORKDIR /app
COPY . .
RUN npm install
CMD ["/bin/sh", "-c", "npm run prod"]
