# E2E Test Example Projects

This folder contains the source code for some of the example apps we use in our "golden recordings".

If you need to rebuild and update an example.

```bash
cd $EXAMPLE_FOLDER

# Install deps
yarn

yarn build

# Copy build artifacts and upload sourcemaps
yarn updateExample
```

then add and commit changes to the `public/test/examples` folder.

You'll probably then need to re-run the `save-example.ts` script to generate a new golden recording.
