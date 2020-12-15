FROM node:14.13.1
WORKDIR /app
COPY . .
RUN npm install
CMD ["/bin/sh", "-c", "npm run prod"]
