![](/public/images/logo.svg)

## Replay

Replay is a new debugger for recording and replaying software. Debugging with Replay should be as simple as viewing print statements and more powerful than pausing with breakpoints. Of course, debugging should be collaborative as well!

### Issues

Feel free to file any issues you see while recording or replaying.

### Setup instructions:

Replay's DevTools is a React app built on top of the Replay [protocol](https://www.notion.so/replayio/Protocol-d8e7b5f428594589ab60c42afad782c1). Make sure to install [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) and [Next CLI](https://nextjs.org/docs/api-reference/cli). Getting started is as simple as:

```
git clone git@github.com:RecordReplay/devtools.git
cd devtools
nvm use
npm install
cp .env.sample .env
npm run dev
```

Once you see `Compiled succesfully` in your terminal, open your browser and go to [this link](http://localhost:8080/recording/d5ce272f-a3de-4af6-8943-2595cb54f1e3).

**You just successfully opened your first Replay recording!** That recording uses your locally running copy of Replay DevTools to debug our test recording.

### Next steps

Next, download and install the [Replay browser](https://www.replay.io/). The browser will allow you to start recording your own replays.

### Community

Everybody's welcome to join us [on Discord](https://replay.io/discord/). We can help with getting started with the project, finding issues to work on and chatting about the future of DevTools.

### Running tests:

To run the end-to-end tests make sure that devtools is running locally on port 8080 and run:

```
node test/run.js [--pattern pat]
```

To run the mock tests:

```
node test/mock/run.js [--pattern pat]
```

To run the unit tests:

```
npm test
```

Note that any options passed after `--` will be passed on to the test runner (jest). So, if you wanted jest to watch the project for changes and run tests when files were saved you could run:

```
npm test -- --watch
```

#### Running tests in VS Code

Install the [Mocha Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter) for the e2e and mock tests and [Jest Test Explorer](https://marketplace.visualstudio.com/items?itemName=kavod-io.vscode-jest-test-adapter) for the unit tests.
You can set environment variables to be used in e2e or mock tests by adding them to the `mochaExplorer.env` setting in `.vscode/settings.json`.

#### Running tests against local builds of the browser

If you want to run the tests against a local build of the browser, you'll need to invoke the tests like so:

```
RECORD_REPLAY_PATH=~/devel/gecko-dev/rr-opt/dist/Replay.app RECORD_REPLAY_BUILD_PATH=~/devel/gecko-dev node test/run.js
```

Replace the paths with the appropriate paths to and within `gecko-dev` as appropriate in your environment.

#### Running tests against local builds of the backend

If you want to run the tests against a local build of the backend, you'll need to invoke the tests like so:

```
RECORD_REPLAY_SERVER=ws://localhost:8000 RECORD_REPLAY_DRIVER=~/devel/backend/out/macOS-recordreplay.so node test/run.js
```

Replace the paths with the appropriate paths within the `backend` repo as appropriate in your environment.

#### Installing the trunk launcher

This project uses [trunk](https://trunk.io) to lint and format its code.

You can [install](https://docs.trunk.io/getting-started) the trunk launcher using the command `curl https://get.trunk.io -fsSL | bash`. This will place `trunk` in your PATH.

#### Linting your changes

In most cases you can simply run `trunk check` which will autodetect the changes you have made and lint them.
If you would like to only autoformat your changes, you can run `trunk fmt`.
More information on using trunk can be found [here](https://docs.trunk.io/getting-started/usage).

#### Generating GraphQL types for Typescript

See [/src/graphql/README.md](./src/graphql/README.md) for details.
