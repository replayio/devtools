require("tailwindcss/tailwind.css");
require("./base.css");

const url = new URL(window.location.href);
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
import "devtools/client/debugger/src/components/variables.css";
import "devtools/client/themes/variables.css";

const BrowserError = React.lazy(() => import("views/browser/error"));
const BrowserImport = React.lazy(() => import("views/browser/import-settings"));
const BrowserLaunch = React.lazy(() => import("views/browser/launch"));
const BrowserNewTab = React.lazy(() => import("views/browser/new-tab"));
const BrowserWelcome = React.lazy(() => import("views/browser/welcome"));
const AppRouter = React.lazy(() => import("views/app"));
const MaintenanceModeScreen = React.lazy(() => import("ui/components/MaintenanceMode"));
const { BlankProgressScreen } = require("ui/components/shared/BlankScreen");

// _ONLY_ set this flag if you want to disable the frontend entirely
const maintenanceMode = false;

ReactDOM.render(
  <React.Suspense
    fallback={<BlankProgressScreen statusMessage="Fetching data" background="white" />}
  >
    <Router>
      <InstallRouteListener />
      <Switch>
        <Route path={maintenanceMode ? "/" : "/maintenance"} component={MaintenanceModeScreen} />
        <Route exact path="/browser/error" component={BrowserError} />
        <Route exact path="/browser/import-settings" component={BrowserImport} />
        <Route exact path="/browser/launch" component={BrowserLaunch} />
        <Route exact path="/browser/new-tab" component={BrowserNewTab} />
        <Route exact path="/browser/welcome" component={BrowserWelcome} />
        <Route component={AppRouter} />
      </Switch>
    </Router>
  </React.Suspense>,
  document.querySelector("#app")
);
