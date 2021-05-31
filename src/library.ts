import { createStore, combineReducers, applyMiddleware } from "redux";
const LogRocket = require("ui/utils/logrocket").default;
import { isDevelopment, skipTelemetry } from "ui/utils/environment";
import { sanityCheckMiddleware } from "ui/utils/sanitize";
import reducer from "ui/reducers/app";
const Account = require("ui/components/Account").default;

export async function initialize() {
  const middleware = skipTelemetry()
    ? isDevelopment()
      ? applyMiddleware(sanityCheckMiddleware)
      : undefined
    : applyMiddleware(LogRocket.reduxMiddleware());

  const store = createStore(combineReducers({ app: reducer }), {}, middleware);

  return { store, Page: Account };
}
