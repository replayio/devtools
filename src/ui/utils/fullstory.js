// Wrapper around FullStory which keeps track of whether it has been initialized.
// This allows disabling FullStory when e.g. running tests.

const FullStory = require("@fullstory/browser");

let gInitialized;

export default {
  init(...args) {
    FullStory.init(...args);
    gInitialized = true;
  },
  event: (name, options) => gInitialized && FullStory.event(name, options),
  identify: uuid => gInitialized && uuid && FullStory.identify(uuid),
  setUserVars: options => gInitialized && FullStory.setUserVars(options),
};
