# Production image for the Socket.IO backend
FROM node:18-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --production --no-audit --no-fund

# Copy application source
COPY . .

EXPOSE 8088

CMD ["npm", "start"]
