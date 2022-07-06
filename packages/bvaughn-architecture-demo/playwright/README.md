# To run tests

## On CI

In this directory, first start the dev server by running:

```sh
# packages/bvaughn-architecture-demo
yarn dev
```

Then verify snapshots by running:

```sh
# packages/bvaughn-architecture-demo/playwright
earthly +playwright
```

## Locally (to update snapshots)

In this directory, first start the dev server by running:

```sh
# packages/bvaughn-architecture-demo
yarn dev
```

Then update snapshots by running:

```sh
# packages/bvaughn-architecture-demo/playwright
earthly +playwright-update-snapshots --HOST=host.docker.internal
```

Note that the value passed for `HOST` varies by operating system:

- Mac OS: "host.docker.internal"
- Linux (GitHub CI): "172.17.0.1"

## Authoring tests

If you're writing new tests, it may be easier to run this command locally:

```sh
yarn test:visual
```

This mode will run tests in a regular Chromium browser so that you can visibly inspect and debug failures. Screenshot comparisons will be skipped in this mode.

Once you are satisfied with the test, run the `+playwright-update-snapshots` Earthly target as shown above.

## Updating protocol fixture data

Test fixture data may need to be updated (if new API calls are added or if the protocol format changes). The "test:update-fixture-data" can help regenerate the data:

```sh
yarn test:update-fixture-data
```

After this script finishes, it will write updated fixture data beside of each test (e.g. `console.ts` fixture data will be written to `console.ts.tmp`). Note that this data needs to be manually copied into the test harness file.

## Debugging failures in Docker

If tests are failing in the Docker container, it can be helpful to record a video of the test using this target:

```sh
# packages/bvaughn-architecture-demo/playwright
earthly +playwright-record-video --HOST=host.docker.internal
```
