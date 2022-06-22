This folder contains the sources for the bundles used in E2E tests.
To rebuild the bundles run
* `yarn build-e2e-prod-bundle`
* `yarn build-e2e-exceptions-bundle`
* `yarn build-e2e-mapped-styles-bundle`
* `yarn build-e2e-mapped-minified-bundle`

After rebuilding you must upload their sourcemaps by running
* `yarn upload-e2e-prod-bundle-sourcemap`
* `yarn upload-e2e-exceptions-bundle-sourcemap`
* `yarn upload-e2e-mapped-styles-bundle-sourcemap`
* `yarn upload-e2e-mapped-minified-bundle-sourcemap`
