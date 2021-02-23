# Running Playwright tests with replay

Playwright scripts can run using replay-enabled versions of firefox on macOS and linux. These instructions describe how to run and record the attached basic.js test.

## macOS installation

1. `./install.sh` Install Replay
2. `npm i` Install Playwright
3. `cp local.env.sample local.env` Add environment variables and update paths
4. `node basic.js` Run test without recording
5. `RECORD_ALL_CONTENT=1 node basic.js`
6. `cat recordings.log` to view the last recording

## Docker installation

1. `docker image pull recordreplayinc/playwright:latest` download image
2. `docker run -v /path/to/devtools/test/playwright:/test -it recordreplayinc/playwright:latest bash` start container
3. `npm i playwright` install playwright package
4. `RECORD_REPLAY_RECORDING_ID_FILE=/recordings.log RECORD_REPLAY_SERVER=wss://dispatch.replay.io RECORD_ALL_CONTENT=1 node test/basic.js` run test
5. `cat recordings.log` to view the last recording

The image can also be built directly with `docker build --no-cache -t recordreplayinc/playwright:latest - < Dockerfile`

## Running the examples

- **Facebook** `node examples/facebook.com`
- **Facebook Homepage** `node examples/facebook.js --destination homepage`
- **Facebook Marketplace** `node examples/facebook.js --destination marketplace`
- **Cypress Dashboard** `node examples/cypress.js`
