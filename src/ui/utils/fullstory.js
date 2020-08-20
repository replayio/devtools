// Wrapper around FullStory which keeps track of whether it has been initialized.
// This allows disabling FullStory when e.g. running tests.

const FullStory = require("@fullstory/browser");

let gInitialized;

function init(...args) {
  FullStory.init(...args);
  gInitialized = true;
}

function event(...args) {
  if (gInitialized) {
    FullStory.event(...args);
  }
}

module.exports = {
  init,
  event,
};
