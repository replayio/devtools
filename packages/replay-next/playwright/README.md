# To run tests

In this directory, first start the dev server by running:

```sh
# packages/bvaughn-architecture-demo
yarn dev
```

Then verify snapshots by running:

```sh
# packages/bvaughn-architecture-demo/playwright
yarn test --update-snapshots
```

## Authoring tests

If you're writing new tests, it may be easier to run this command locally:

```sh
yarn test:visual
```

This mode will run tests in a regular Chromium browser so that you can visibly inspect and debug failures. Screenshot comparisons will be skipped in this mode.

Once you are satisfied with the test, generate the protocol fixture data as described in the section below.

## Updating protocol fixture data

Test fixture data may need to be updated (if new API calls are added or if the protocol format changes). The `"test:update-fixture-data"` script can help regenerate the data:

```sh
yarn test:update-fixture-data
```

After this script finishes, it will write updated fixture data locally which will need to be committed to Git along with other changes.
