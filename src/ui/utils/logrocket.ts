import * as Sentry from "@sentry/react";
import LogRocket from "logrocket";
import setupLogRocketReact from "logrocket-react";
import { UserInfo } from "ui/hooks/users";
import { Recording, ExperimentalUserSettings } from "ui/types";

import { skipTelemetry } from "./environment";

let setup = false;

export default {
  createSession: ({
    recording,
    userInfo,
    auth0User,
    userSettings,
  }: {
    recording?: Recording;
    userInfo?: Omit<UserInfo, "loading">;
    auth0User: any;
    userSettings: ExperimentalUserSettings;
  }) => {
    // Skip if the recording was either created or viewed by an internal user
    if (
      userSettings.disableLogRocket ||
      recording?.user?.internal ||
      userInfo?.internal ||
      skipTelemetry()
    ) {
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
    if (auth0User) {
      LogRocket.identify(auth0User.sub, {
        email: auth0User.email,
        id: auth0User.email,
        name: auth0User.name,
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
