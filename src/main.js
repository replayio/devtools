require("tailwindcss/tailwind.css");

const url = new URL(window.location.href);
const test = url.searchParams.get("test");

// During testing, make sure we clear local storage before importing
// any code that might instantiate preferences from local storage.
// If the url contains a "navigated" parameter, we assume this is the
// second part of a test that contains a navigation and don't clear
// local storage in that case.
if (test && !url.searchParams.get("navigated")) {
  localStorage.clear();
  require("devtools-modules").asyncStorage.clear();
}

// *** WARNING ***
//
// Do not use "import" in this file. The import will run before we clear
// the local storage above, and existing local storage contents may be used
// when running automated tests, which we don't want to happen. It would
// be good if this was less fragile...
//

require("ui/utils/whatwg-url-fix");
const React = require("react");
const ReactDOM = require("react-dom");
const { bootstrapApp } = require("ui/setup");
const AppRouting = require("views/routing").default;
require("image/image.css");

bootstrapApp();

ReactDOM.render(<AppRouting />, document.querySelector("#app"));
