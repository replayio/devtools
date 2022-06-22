This folder contains a simple CRA app for use in E2E tests.
* `src` contains the app's source
* `dist` contains the app - don't modify these files manually
* `build.js` contains the script to rebuild the app

To modify the app, edit the source in `src` and then run `yarn build-e2e-cra-test`.
Then upload the sourcemaps by running `yarn upload-e2e-cra-test-sourcemaps`.
