# End to End tests

The End To End test runner is responsible for running tests for our forks of Node, Gecko, and Chromium on Mac OSX, Linux, and Windows.

## Tests configuration

Tests are defined in the `manifest.js` file.

```js
// Example browser based e2e tests
{
  "example": "doc_rr_basic.html",
  "script": "breakpoints-02.js",
  "targets": ["gecko", "chromium"]
},

// Example Node e2e tests
{
  "example": "node/control_flow.js",
  "script": "node_control_flow.js",
  "targets": ["node"],
},

// ...
```

## Installation

To run the e2e tests, you'll need to install the Replay Browser (download it [here](https://static.replay.io/downloads/replay.dmg)) and the Replay fork of Node:

```sh
npm i -g @replayio/node
```

To ensure you have the latest versions installed, run:

```sh
replay update-browsers
replay-node --update
```

## Running tests

Tests can be run using:

```sh
yarn test-e2e
```

To run a subset of tests, pass a naming pattern:

```sh
yarn test-e2e breakpoints
```
