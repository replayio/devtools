require("tailwindcss/tailwind.css");

const url = new URL(window.location.href);

// Coercing recordingId to undefined so that it is not passed to auth0
const recordingId = url.searchParams.get("id") || undefined;

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

const React = require("react");
const { useEffect, useState } = React;
const ReactDOM = require("react-dom");
const { Provider } = require("react-redux");
const { BrowserRouter: Router, Route, Switch } = require("react-router-dom");
const tokenManager = require("ui/utils/tokenManager").default;
const { setupTelemetry } = require("ui/utils/telemetry");
const { ApolloWrapper } = require("ui/utils/apolloClient");
const App = require("ui/components/App").default;
const BlankLoadingScreen = require("ui/components/shared/BlankScreen").BlankLoadingScreen;

require("image/image.css");

document.body.addEventListener("contextmenu", e => e.preventDefault());

setupTelemetry({ recordingId });

const BrowserError = React.lazy(() => import("views/browser/error"));

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
  <React.Suspense fallback={() => <div>Loading</div>}>
    <Router>
      <Switch>
        <Route exact path="/browser/error" component={BrowserError} />
        <Route>
          <tokenManager.Auth0Provider>
            <ApolloWrapper recordingId={recordingId}>
              <PageSwitch />
            </ApolloWrapper>
          </tokenManager.Auth0Provider>
        </Route>
      </Switch>
    </Router>
  </React.Suspense>,
  document.querySelector("#app")
);
