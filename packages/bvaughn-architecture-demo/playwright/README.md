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
yarn test:visual --update-snapshots
```

Once you are satisfied with the test, delete any newly added snapshots (since they're specific to your operating system) and run the `+playwright-update-snapshots` Earthly target as shown above.
