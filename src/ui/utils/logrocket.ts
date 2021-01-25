import LogRocket from "logrocket";
import setupLogRocketReact from "logrocket-react";

let setup = false;

export default {
  init: () => {
    setup = true;
    setupLogRocketReact(LogRocket);
    LogRocket.init("4sdo4i/replay");
  },
  identify: (uuid: string, attributes: Record<string, string | number | boolean>) =>
    setup && LogRocket.identify(uuid, attributes),
  getSessionURL: (callback: (sessionUrl: string) => void) =>
    setup && LogRocket.getSessionURL(callback),
  reduxMiddleware: () =>
    LogRocket.reduxMiddleware({
      actionSanitizer: action => ({ type: action.type }),
      stateSanitizer: () => ({}),
    }),
};
