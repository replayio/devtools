import hooks from "ui/hooks";
import { useAppDispatch } from "ui/setup/hooks";
import { Workspace } from "ui/types";
import { UserInfo } from "ui/hooks/users";
import { downloadReplay, firstReplay, singleInvitation } from "ui/utils/onboarding";
import { trackEvent } from "ui/utils/telemetry";
import { setModal } from "ui/actions/app";
import { useEffect } from "react";

function useGetNagPreRequisites() {
  const { loading: userInfoLoading, ...userInfo } = hooks.useGetUserInfo();
  const { pendingWorkspaces, loading: pendingWorkspacesLoading } = hooks.useGetPendingWorkspaces();
  const { workspaces, loading: workspacesLoading } = hooks.useGetNonPendingWorkspaces();

  if (userInfoLoading || pendingWorkspacesLoading || workspacesLoading) {
    return { loading: true };
  }

  return { userInfo, pendingWorkspaces, workspaces, loading: false };
}

function NagSwitcher({
  userInfo,
  pendingWorkspaces,
  workspaces,
}: {
  userInfo: UserInfo;
  pendingWorkspaces?: Workspace[];
  workspaces: Workspace[];
}) {
  const dispatch = useAppDispatch();
  const dismissNag = hooks.useDismissNag();

  useEffect(function handleOnboardingModals() {
    if (singleInvitation(pendingWorkspaces?.length || 0, workspaces.length)) {
      trackEvent("onboarding.team_invite");
      dispatch(setModal("single-invite"));
    } else if (downloadReplay(userInfo.nags, dismissNag)) {
      trackEvent("onboarding.download_replay_prompt");
      dispatch(setModal("download-replay"));
    } else if (firstReplay(userInfo.nags)) {
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
  const { userInfo, pendingWorkspaces, workspaces, loading } = useGetNagPreRequisites();

  if (loading) {
    return null;
  }

  return (
    <NagSwitcher
      userInfo={userInfo!}
      pendingWorkspaces={pendingWorkspaces}
      workspaces={workspaces!}
    />
  );
}
