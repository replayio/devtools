import { useEffect } from "react";

import { setModal } from "ui/actions/app";
import hooks from "ui/hooks";
import { UserInfo } from "ui/hooks/users";
import { useAppDispatch } from "ui/setup/hooks";
import { firstReplay } from "ui/utils/onboarding";
import { trackEvent } from "ui/utils/telemetry";

function NagSwitcher({ userInfo }: { userInfo: UserInfo }) {
  const dispatch = useAppDispatch();

  useEffect(function handleOnboardingModals() {
    if (firstReplay(userInfo.nags)) {
      trackEvent("onboarding.demo_replay_prompt");
      dispatch(setModal("first-replay"));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// The way Nags are done here are _very_ janky and should probably be rewritten. For now,
// I just carved it off into its own component so that it's isolated from the rest of the
// Library code.
export function LibraryNags() {
  const { loading, ...userInfo } = hooks.useGetUserInfo();

  if (loading) {
    return null;
  }

  return <NagSwitcher userInfo={userInfo!} />;
}
