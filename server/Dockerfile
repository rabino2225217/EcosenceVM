# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache wget

RUN addgroup -S app && adduser -S app -G app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .
RUN chown -R app:app /app

# Ensure uploads directory exists with proper permissions
RUN mkdir -p /app/uploads/temp && \
    chown -R app:app /app/uploads && \
    chmod -R 755 /app/uploads

USER app
EXPOSE 4000

CMD ["node", "server.js"]


