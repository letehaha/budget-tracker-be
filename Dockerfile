FROM node:21.7.3
WORKDIR /app
COPY . .
RUN npm ci
ENV NODE_ENV=production
CMD ["/bin/sh", "-c", "npm run prod"]
