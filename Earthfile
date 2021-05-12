FROM node:12

build:
    COPY package.json package-lock.json ./
    RUN npm install
    SAVE ARTIFACT node_modules
    COPY src src
    RUN mkdir -p ./dist
    COPY postcss.config.js .
    COPY webpack.config.js .
    ARG GIT_SHA
    RUN REPLAY_BUILD_VISUALIZE=1 ./node_modules/.bin/webpack --mode=production --env REPLAY_RELEASE=$GIT_SHA
    SAVE ARTIFACT dist /dist AS LOCAL ./dist

dist:
    COPY +build/node_modules node_modules
    COPY index.html .
    COPY +build/dist dist
    RUN tar -czf dist.tgz index.html dist node_modules
    SAVE ARTIFACT dist.tgz AS LOCAL ./dist.tgz