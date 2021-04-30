import mixpanel from "mixpanel-browser";
import * as Sentry from "@sentry/react";

export function setTelemetryContext(
  userId: string | undefined,
  userEmail: string | undefined,
  isInternal: boolean
) {
  let sentryContext: Record<string, string | boolean> = { isInternal };
  if (userId) {
    mixpanel.identify(userId);
    sentryContext["userId"] = userId;
  }

  if (userEmail) {
    mixpanel.people.set({ $email: userEmail });
    sentryContext["userEmail"] = userEmail;
  }

  Sentry.setContext("user", sentryContext);
}
