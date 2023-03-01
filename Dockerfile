FROM node:16

# example of use:
# docker build -t silex-image .
# docker run -p 6805:6805 -t --rm --name silex -e GITHUB_CLIENT_ID=false -e FS_ROOT=/ silex-image

# env vars can be overriden using the `-e` option in docker run, some env vars are:
# ENV DROPBOX_APP_ID

EXPOSE 6805

COPY . /cloud-explorer
WORKDIR /cloud-explorer
#RUN apt-get update

# Not needed apparently
# Install yarn
# RUN npm install -g yarn

# With yarn
# This is a workaround because npm install takes a long time
# This doesn't work because silex-website-builder has a postinstall script containing an npm command
# RUN yarn install --ignore-engines
# RUN yarn build
# CMD ["yarn", "start"]

# With npm
# Running install with --unsafe-perm option becaus when running as root, npm won't run any scripts.
RUN npm install --unsafe-perm
# Already in postinstall: RUN npm run build
RUN npm run build:prod
CMD ["npm", "start"]
