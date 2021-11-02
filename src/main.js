require("tailwindcss/tailwind.css");
require("./base.css");

const { requiresWindow } = require("./ssr");

requiresWindow(win => {
  const url = new URL(win.location.href);
  const test = url.searchParams.get("test");

  // During testing, make sure we clear local storage before importing
  // any code that might instantiate preferences from local storage.
  // If the url contains a "navigated" parameter, we assume this is the
  // second part of a test that contains a navigation and don't clear
  // local storage in that case.
  if (test && !url.searchParams.get("navigated")) {
    localStorage.clear();
    require("devtools/shared/async-storage").clear();
  }
});

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
const { BrowserRouter: Router, Route, Switch } = require("react-router-dom");
const { InstallRouteListener } = require("ui/utils/routeListener");

const AppRouter = React.lazy(() => import("views/app"));
const MaintenanceModeScreen = React.lazy(() => import("ui/components/MaintenanceMode"));
const { BlankProgressScreen } = require("ui/components/shared/BlankScreen");

// _ONLY_ set this flag if you want to disable the frontend entirely
const maintenanceMode = true;

ReactDOM.render(
  <React.Suspense
    fallback={<BlankProgressScreen statusMessage="Fetching data" background="white" />}
  >
    <Router>
      <InstallRouteListener />
      <Switch>
        <Route path={maintenanceMode ? "/" : "/maintenance"} component={MaintenanceModeScreen} />
        <Route component={AppRouter} />
      </Switch>
    </Router>
  </React.Suspense>,
  document.querySelector("#app")
);
