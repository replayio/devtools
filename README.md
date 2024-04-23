![](/public/images/logo.svg)

# Replay

Replay is a new debugger for recording and replaying software. Debugging with Replay should be as simple as viewing print statements and more powerful than pausing with breakpoints. Of course, debugging should be collaborative as well!

## Issues

Feel free to file any issues you see while recording or replaying.

## Getting started

Replay's DevTools is a React app built on top of the Replay [protocol](https://www.notion.so/replayio/Protocol-d8e7b5f428594589ab60c42afad782c1). Make sure to install [nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

> **Note**: We use Yarn 3 for package management - make sure you have Yarn installed globally first:
> `npm i -g yarn`

Getting started is as simple as:

```sh
# Setup environment variables
cp .env.sample .env

# Install dependencies
nvm use
yarn install

# Run dev server (localhost:8080 by default)
yarn dev
```

Once you see `Compiled successfully` in your terminal, open your browser and go to [this link](http://localhost:8081/recording/overboard--a616009e-b825-4c54-83b4-e20bd8c0cb25).

**You just successfully opened your first Replay recording!** That recording uses your locally running copy of Replay DevTools to debug our test recording.

### Local development

To run both the DevTools and [Dashboard](https://github.com/replayio/dashboard) projects locally:

```sh
# DevTools root (this project)
DASHBOARD_URL=http://localhost:8080 npm exec next dev -- -p 8081

# Dashboard root
DEVTOOLS_URL=http://localhost:8081 pnpm dev -- -p 8080
```

At this point the Dashboard will be accessible at [localhost:8080](http://localhost:8080/) but it will not load recordings. To be able to test the end-to-end interaction of both apps, use [localhost:8081](http://localhost:8081/). It will serve both Dashboard and DevTools routes.

### Next steps

Next, download and install the [Replay browser](https://www.replay.io/). The browser will allow you to start recording your own replays.

### Community

Everybody's welcome to join us [on Discord](https://replay.io/discord/), but please read through our [Community Etiquette](https://docs.replay.io/contribute/contributing-to-replay) guidelines first.

### Contributing to the project

Anyone is welcome to contribute to the project! If you're just getting started we recommend you start by reading the [contributing guide](https://github.com/replayio/devtools/blob/main/docs/contributing.md) and then check out the ["good first issues"](https://github.com/RecordReplay/devtools/issues?q=is%3Aissue+is%3Aopen+label%3A%22Good+first+issue%22). If you have questions you can ask in the in the [#development](https://discord.com/channels/779097926135054346/795692423513767956) channel. (Please do not "@" or direct message people with questions though!)

### Running tests:

To run the end-to-end tests make sure that devtools is running locally on port 8080 and run:

```
cd packages/e2e-tests

yarn test
```

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

This project uses [trunk](https://trunk.io) to lint and format its code. Trunk is installed as a dev dependency so you can invoke it as `npx trunk`.
To learn more about `trunk`, check out the [documentation](https://docs.trunk.io).

#### Linting your changes

In most cases you can simply run `trunk check` which will autodetect the changes you have made and lint them.
If you would like to only autoformat your changes, you can run `trunk fmt`.
More information on using trunk can be found [here](https://docs.trunk.io/getting-started/usage).

#### Generating GraphQL types for Typescript

See [/src/graphql/README.md](./src/graphql/README.md) for details.

### Deploying

Every commit to the main branch is automatically deployed to production.
