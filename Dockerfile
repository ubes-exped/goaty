FROM node:10.15.3-stretch-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
COPY config.js ./
RUN yarn install --production

# Bundle app source
COPY . .

CMD [ "yarn", "start" ]
