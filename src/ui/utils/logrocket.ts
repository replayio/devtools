import * as Sentry from "@sentry/react";
import LogRocket from "logrocket";
import setupLogRocketReact from "logrocket-react";

import { Recording, UserSettings } from "shared/graphql/types";
import { userData } from "shared/user-data/GraphQL/UserData";
import { skipTelemetry } from "shared/utils/environment";
import { UserInfo } from "ui/hooks/users";

let setup = false;

export default {
  createSession: ({
    recording,
    userInfo,
  }: {
    recording?: Recording;
    userInfo?: Omit<UserInfo, "loading">;
  }) => {
    // Skip if the recording was either created or viewed by an internal user
    if (
      userData.get("global_disableLogRocket") ||
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
    if (userInfo) {
      LogRocket.identify(userInfo.id, {
        name: userInfo.name || "",
        email: userInfo.email,
        id: userInfo.email,
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
