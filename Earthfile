VERSION 0.6

# NOTE(dmiller): this needs to be 16._15_ otherwise playwright will fail to install, at least until we update our playwright version
FROM node:16.15-bullseye-slim

image:
  RUN apt-get update && apt-get install -y python3 build-essential
  WORKDIR /app

  COPY package.json yarn.lock .
  RUN yarn set version 3.2.1
  COPY packages/protocol/package.json packages/protocol/package.json .
  COPY packages/bvaughn-architecture-demo/package.json packages/bvaughn-architecture-demo/package.json .
  COPY packages/design/package.json packages/design/package.json .
  COPY packages/bvaughn-architecture-demo/playwright/package.json packages/bvaughn-architecture-demo/playwright/package.json .

  COPY .yarnrc.yml .
  COPY .yarn/plugins/@yarnpkg/plugin-workspace-tools.cjs .yarn/plugins/@yarnpkg/plugin-workspace-tools.cjs
  RUN yarn install

  COPY . .

  WORKDIR /app/packages/bvaughn-architecture-demo
  RUN yarn install
  CMD yarn dev
  EXPOSE 3000
  SAVE IMAGE devtools

test-architecture-demo:
  FROM earthly/dind:alpine
  WITH DOCKER --load devtools:latest=+image --load playwright-test-image=(./packages/bvaughn-architecture-demo/playwright+playwright-test-image --HOST=devtools)
    RUN docker network create --driver bridge integration && docker run -d -p 3000 --network integration --name devtools devtools && docker run --network integration playwright-test-image
  END

test-architecture-demo-save-snapshots:
  FROM earthly/dind:alpine
  WITH DOCKER --load devtools:latest=+image --load playwright-test-image=(./packages/bvaughn-architecture-demo/playwright+playwright-save-test-image --HOST=devtools)
    RUN docker network create --driver bridge integration && docker run -d -p 3000 --network integration --name devtools devtools && docker run -v /snapshots:/playwright/snapshots --network integration playwright-test-image || true
  END
  SAVE ARTIFACT ./snapshots AS LOCAL ./packages/bvaughn-architecture-demo/playwright/snapshots

test-architecture-demo-save-video:
  FROM earthly/dind:alpine
  WITH DOCKER --load devtools:latest=+image --load playwright-test-image=(./packages/bvaughn-architecture-demo/playwright+playwright-save-video --HOST=devtools)
    RUN docker network create --driver bridge integration && docker run -d -p 3000 --network integration --name devtools devtools && docker run -v /test-results:/playwright/test-results --network integration playwright-test-image || true
  END
  SAVE ARTIFACT ./test-results AS LOCAL ./packages/bvaughn-architecture-demo/playwright/test-results