import LogRocket from "logrocket";
import setupLogRocketReact from "logrocket-react";
import { sanitizeAction, sanitizeState } from "./sanitize";

let setup = false;

export default {
  init: () => {
    setup = true;
    setupLogRocketReact(LogRocket);
    LogRocket.init("4sdo4i/replay");
  },
  identify: (uuid, attributes) => setup && LogRocket.identify(uuid, attributes),
  getSessionURL: callback => setup && LogRocket.getSessionURL(callback),
  reduxMiddleware: () =>
    LogRocket.reduxMiddleware({
      actionSanitizer: action => ({ type: action.type }),
      stateSanitizer: () => ({}),
    }),
};
