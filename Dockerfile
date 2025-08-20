# Start from an official Node.js runtime image
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install the application's dependencies
RUN npm install

# Copy the application's source code FROM the 'src' directory
# This is the line that fixes the error.
COPY src/ .

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD [ "node", "server.js" ]