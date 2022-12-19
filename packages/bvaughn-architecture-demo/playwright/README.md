# To run tests

## On CI

In this directory, first start the dev server by running:

```sh
# packages/bvaughn-architecture-demo
yarn dev
```

## Updating protocol fixture data

Test fixture data may need to be updated (if new API calls are added or if the protocol format changes). The "test:update-fixture-data" can help regenerate the data:

```sh
yarn test:update-fixture-data
```

After this script finishes, it will write updated fixture data locally which will need to be committed to Git along with other changes.
