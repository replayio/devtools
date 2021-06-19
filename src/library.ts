import { combineReducers, applyMiddleware } from "redux";
const LogRocket = require("ui/utils/logrocket").default;
import { isDevelopment, skipTelemetry } from "ui/utils/environment";
import { sanityCheckMiddleware } from "ui/utils/sanitize";
const configureStore = require("devtools/client/debugger/src/actions/utils/create-store").default;
import reducer from "ui/reducers/app";
import { getUserSettings } from "ui/hooks/settings";
import { setWorkspaceId } from "ui/actions/app";
const { prefs, features } = require("ui/utils/prefs");

const Account = require("ui/components/Account").default;

export async function initialize() {
  const middleware = skipTelemetry()
    ? isDevelopment()
      ? applyMiddleware(sanityCheckMiddleware)
      : undefined
    : applyMiddleware(LogRocket.reduxMiddleware());

  const createStore = configureStore();
  const store = createStore(combineReducers({ app: reducer }), {}, middleware);

  const settings = await getUserSettings();
  store.dispatch(setWorkspaceId(settings.defaultWorkspaceId));

  (window as any).app = {
    store,
    prefs,
    features,
  };

  return { store, Page: Account };
}
