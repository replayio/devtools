import { combineReducers, applyMiddleware } from "redux";
const LogRocket = require("ui/utils/logrocket").default;
const configureStore = require("devtools/client/debugger/src/actions/utils/create-store").default;
import { isDevelopment, skipTelemetry } from "ui/utils/environment";
import { sanityCheckMiddleware } from "ui/utils/sanitize";
import reducer from "ui/reducers/app";
import BlankScreen from "ui/components/shared/BlankScreen";

const url = new URL(window.location.href);
const recordingId = url.searchParams.get("id")!;

export async function initialize() {
  const middleware = skipTelemetry()
    ? isDevelopment()
      ? applyMiddleware(sanityCheckMiddleware)
      : undefined
    : applyMiddleware(LogRocket.reduxMiddleware());

  const createStore = configureStore();
  const store = createStore(combineReducers({ app: reducer }), {}, middleware);
  store.dispatch({ type: "setup_app", recordingId });

  return { store, Page: BlankScreen };
}
