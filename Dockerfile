FROM node:16.13.1
WORKDIR /app
COPY . .
RUN npm ci
CMD ["/bin/sh", "-c", "npm run prod"]
