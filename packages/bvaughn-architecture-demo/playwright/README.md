### To run tests and compare snapshots:

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

### To run tests and update snapshots

In this directory, first start the dev server by running:

```sh
# packages/bvaughn-architecture-demo
yarn dev
```

Then update snapshots by running:

```sh
# packages/bvaughn-architecture-demo/playwright
earthly +playwright-update-snapshots
```
