FROM node:18.14.0
WORKDIR /app
COPY . .
RUN npm ci
ENV NODE_ENV=production
CMD ["/bin/sh", "-c", "npm run prod"]
