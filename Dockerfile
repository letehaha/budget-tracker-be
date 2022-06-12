FROM node:16.13.1
WORKDIR /app
COPY . .
RUN npm ci
ENV NODE_ENV=production
RUN npm run migrate
RUN npm run seed
CMD ["/bin/sh", "-c", "npm run prod"]
