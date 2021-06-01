require("tailwindcss/tailwind.css");

const url = new URL(window.location.href);

// Coercing recordingId to undefined so that it is not passed to auth0
const recordingId = url.searchParams.get("id") || undefined;

const test = url.searchParams.get("test");

// During testing, make sure we clear local storage before importing
// any code that might instantiate preferences from local storage.
if (test) {
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

const React = require("react");
const { useEffect, useState } = React;
const ReactDOM = require("react-dom");
const { Provider } = require("react-redux");
const { BrowserRouter: Router } = require("react-router-dom");
const tokenManager = require("ui/utils/tokenManager").default;
const { setupTelemetry } = require("ui/utils/telemetry");
const { ApolloWrapper } = require("ui/utils/apolloClient");
const App = require("ui/components/App").default;

require("image/image.css");

document.body.addEventListener("contextmenu", e => e.preventDefault());

setupTelemetry({ recordingId });

function PageSwitch() {
  const [pageWithStore, setPageWithStore] = useState(null);

  useEffect(() => {
    async function importAndInitialize() {
      const imported = await (recordingId ? import("./app") : import("./library"));
      const pageWithStore = await imported.initialize();
      setPageWithStore(pageWithStore);
    }
    importAndInitialize();
  }, []);

  if (!pageWithStore) {
    return null;
  }

  const { Page, store } = pageWithStore;
  return (
    <Provider store={store}>
      <App>
        <Page />
      </App>
    </Provider>
  );
}

ReactDOM.render(
  <Router>
    <tokenManager.Auth0Provider>
      <ApolloWrapper recordingId={recordingId}>
        <PageSwitch />
      </ApolloWrapper>
    </tokenManager.Auth0Provider>
  </Router>,
  document.querySelector("#app")
);
