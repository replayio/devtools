import LogRocket from "logrocket";
import setupLogRocketReact from "logrocket-react";
import * as Sentry from "@sentry/react";
import { skipTelemetry } from "./environment";
import { Recording } from "ui/types";
import { UserInfo } from "ui/hooks/users";
import { AuthContext } from "ui/utils/useAuth0";

let setup = false;

export default {
  createSession: ({
    recording,
    userInfo,
    auth,
  }: {
    recording?: Recording;
    userInfo: UserInfo;
    auth: AuthContext;
  }) => {
    // Skip if the recording was either created or viewed by an internal user
    if (recording?.user?.internal || userInfo.internal || skipTelemetry()) {
      return;
    }

    if (setup) {
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

    // only identify the session if there is a logged in user
    if (auth?.user) {
      LogRocket.identify(auth.user.sub, {
        name: auth.user.name,
        email: auth.user.email,
        id: auth.user.email,
      });
    }
  },

  getSessionURL: (callback: (sessionUrl: string) => void) =>
    setup && LogRocket.getSessionURL(callback),
  reduxMiddleware: () =>
    LogRocket.reduxMiddleware({
      actionSanitizer: action => ({ type: action.type }),
      stateSanitizer: () => ({}),
    }),
};
