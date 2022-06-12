FROM node:16.13.1
WORKDIR /app
COPY . .
RUN npm ci
ENV NODE_ENV=production
CMD ["/bin/sh", "-c", "npm run prod"]
