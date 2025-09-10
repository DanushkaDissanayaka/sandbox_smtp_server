# Use the official Node.js runtime as base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Create a directory for the database with proper permissions
RUN mkdir -p /app/data && chown -R node:node /app/data

# Create a non-root user to run the application
USER node

# Expose the ports that the app runs on
EXPOSE 3000 2525

# Set environment variable for database path to persist data
ENV DB_PATH=/app/data/emails.db

# Define the command to run the application
CMD ["npm", "start"]
