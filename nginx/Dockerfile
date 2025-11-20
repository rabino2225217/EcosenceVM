FROM nginx:alpine

# Install wget and netcat for healthcheck and startup script
RUN apk add --no-cache wget netcat-openbsd

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create startup script that waits for backend
RUN echo '#!/bin/sh' > /wait-for-backend.sh && \
    echo 'set -e' >> /wait-for-backend.sh && \
    echo 'echo "Waiting for backend server..."' >> /wait-for-backend.sh && \
    echo 'until nc -z server 4000 2>/dev/null; do' >> /wait-for-backend.sh && \
    echo '  echo "Backend not ready, waiting..."' >> /wait-for-backend.sh && \
    echo '  sleep 2' >> /wait-for-backend.sh && \
    echo 'done' >> /wait-for-backend.sh && \
    echo 'echo "Backend is ready, starting nginx..."' >> /wait-for-backend.sh && \
    chmod +x /wait-for-backend.sh

# Create necessary directories
RUN mkdir -p /var/cache/nginx/client_temp

EXPOSE 80

CMD ["sh", "-c", "/wait-for-backend.sh && nginx -g 'daemon off;'"]

