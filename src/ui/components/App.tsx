import { PropsWithChildren, useEffect } from "react";

import Spinner from "replay-next/components/Spinner";
import { getSystemColorScheme } from "shared/theme/getSystemColorScheme";
import { Theme } from "shared/theme/types";
import { userData } from "shared/user-data/GraphQL/UserData";
import { isTest } from "shared/utils/environment";
import { AppModal } from "ui/components/AppModal";
import hooks from "ui/hooks";
import { Nag, useGetUserInfo } from "ui/hooks/users";
import { getAccessToken } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";
import { shouldShowNag } from "ui/utils/tour";

import { ConfirmRenderer } from "./shared/Confirm";
import TOSScreen, { LATEST_TOS_VERSION } from "./TOSScreen";

export default function App({ children }: PropsWithChildren) {
  const accessToken = useAppSelector(getAccessToken);

  const dismissNag = hooks.useDismissNag();
  const userInfo = useGetUserInfo();

  useEffect(() => {
    if (userInfo.nags && shouldShowNag(userInfo.nags, Nag.FIRST_LOG_IN)) {
      trackEvent("login.first_log_in");
      dismissNag(Nag.FIRST_LOG_IN);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo.nags]);

  useEffect(() => {
    // Stop space bar from being used as a universal "scroll down" operator
    // We have a big play/pause interface, so space makes way more sense for that.

    const stopCodeMirrorScroll = (e: KeyboardEvent) => {
      if (e.code !== "Space") {
        return;
      }

      if (
        e.target === document.body ||
        (e.target?.hasOwnProperty("classList") &&
          (e.target as Element).classList.contains(".CodeMirror-scroll"))
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", stopCodeMirrorScroll);
    return () => window.removeEventListener("keydown", stopCodeMirrorScroll);
  }, []);

  useEffect(() => {
    const updateTheme = (theme: Theme) => {
      if (theme === "system") {
        theme = getSystemColorScheme();
      }
      document.body.parentElement!.className = `theme-${theme}`;
    };

    updateTheme(userData.get("global_theme"));

    userData.subscribe("global_theme", updateTheme);
  }, []);

  if (userInfo.loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (
    !isTest() &&
    accessToken &&
    userInfo.acceptedTOSVersion &&
    userInfo.acceptedTOSVersion !== LATEST_TOS_VERSION
  ) {
    return <TOSScreen />;
  }

  return (
    <div id="app-container">
      {children}
      <AppModal />
      <ConfirmRenderer />
    </div>
  );
}
