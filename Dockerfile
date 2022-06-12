FROM node:16.13.1
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run migrate
RUN npm run seed
CMD ["/bin/sh", "-c", "npm run prod"]
