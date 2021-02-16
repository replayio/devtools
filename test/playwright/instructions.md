# Running Playwright tests with replay

Playwright scripts can run using replay-enabled versions of firefox on macOS and linux. These instructions describe how to run and record the attached basic.js test. These setup instructions are macOS-specific and experimental and will be refined over time.

1. `./install.sh` Install Replay
2. `npm i` Install Playwright
3. `cp local.env.sample local.env` Add environment variables and update paths
4. `node basic.js` Run test without recording
5. `RECORD_ALL_CONTENT=1 node basic.js`
6. `cat recordings.log` to view the last recording

Note: The test is configured to launch firefox in headful (not headless) mode, to make it easier to see what the test is doing. Things should work when launching in headless mode as well.

## Running the examples

- **Facebook** `node examples/facebook.com`
- **Facebook Homepage** `node examples/facebook.js --destination homepage`
- **Facebook Marketplace** `node examples/facebook.js --destination marketplace`
- **Cypress Dashboard** `node examples/cypress.js`
