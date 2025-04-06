FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Expose ports
EXPOSE 3000 3001

# Start the application
CMD ["npm", "run", "dev"]
