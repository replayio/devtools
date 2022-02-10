This folder contains the sources for the bundles used in E2E tests.
To rebuild the bundles run
* `npm run build-e2e-prod-bundle`
* `npm run build-e2e-exceptions-bundle`
* `npm run build-e2e-mapped-styles-bundle`
* `npm run build-e2e-mapped-minified-bundle`

After rebuilding you must upload their sourcemaps by running
* `npm run upload-e2e-prod-bundle-sourcemap`
* `npm run upload-e2e-exceptions-bundle-sourcemap`
* `npm run upload-e2e-mapped-styles-bundle-sourcemap`
* `npm run upload-e2e-mapped-minified-bundle-sourcemap`
