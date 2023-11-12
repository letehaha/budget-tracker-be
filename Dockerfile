FROM node:20.9.0
WORKDIR /app
COPY . .
RUN npm ci
ENV NODE_ENV=production
CMD ["/bin/sh", "-c", "npm run prod"]
