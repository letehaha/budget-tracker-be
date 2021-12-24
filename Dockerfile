FROM node:12.6.0
WORKDIR /app
COPY . .
RUN npm ci
CMD ["/bin/sh", "-c", "npm run prod"]
