import LogRocket from "logrocket";
import setupLogRocketReact from "logrocket-react";
import * as Sentry from "@sentry/react";
import { skipTelemetry } from "./environment";

let setup = false;

export default {
  createSession: (auth: any) => {
    if (skipTelemetry()) {
      return;
    }

    setup = true;
    setupLogRocketReact(LogRocket);
    LogRocket.init("4sdo4i/replay");
    LogRocket.getSessionURL(sessionURL => {
      Sentry.configureScope(scope => {
        scope.setExtra("sessionURL", sessionURL);
      });
    });

    LogRocket.identify(auth.user.sub, {
      name: auth.user.name,
      email: auth.user.email,
      id: auth.user.email,
    });
  },

  getSessionURL: (callback: (sessionUrl: string) => void) =>
    setup && LogRocket.getSessionURL(callback),
  reduxMiddleware: () =>
    LogRocket.reduxMiddleware({
      actionSanitizer: action => ({ type: action.type }),
      stateSanitizer: () => ({}),
    }),
};
