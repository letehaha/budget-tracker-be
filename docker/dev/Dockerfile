FROM node:21.7.3
WORKDIR /app

# Copy the rest of the application
COPY . .

# Install dependencies
RUN chmod +x ./post-install.sh
RUN npm ci --also=dev

ENV NODE_ENV=development

# Prepare and execute entrypoint script
RUN chmod +x /app/docker/dev/docker-entrypoint.sh
ENTRYPOINT ["/app/docker/dev/docker-entrypoint.sh"]

CMD ["/bin/sh", "-c", "npm run dev"]
