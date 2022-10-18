import { useContext } from "react";

import { Nag } from "@bvaughn/src/graphql/types";
import { SessionContext } from "@bvaughn/src/contexts/SessionContext";

export const useShowRewindForNUX = (isLastMessage: boolean) => {
  const { currentUserInfo } = useContext(SessionContext);
  // Avoid showing this if they're anonymous. This also
  // simplifies the screenshot tests.
  const hasUserInfo = !!currentUserInfo;
  const hasCompletedRewindOnboarding = currentUserInfo?.nags?.includes(Nag.FIRST_CONSOLE_NAVIGATE);

  // Only force showing the "Rewind" button if the user has not yet
  // completed this step, _and_ it's the last message in the focus range.
  return hasUserInfo && !hasCompletedRewindOnboarding && isLastMessage;
};
