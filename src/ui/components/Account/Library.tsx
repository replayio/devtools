import React, { useEffect, useState } from "react";
import Dashboard from "../Dashboard/index";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import * as actions from "ui/actions/app";
import WorkspaceDropdown from "../Dashboard/Navigation/WorkspaceDropdown";
import { Workspace } from "ui/types";
import { CogIcon } from "@heroicons/react/solid";
import { ModalType } from "ui/state/app";
import { UIState } from "ui/state";
import * as selectors from "ui/reducers/app";
import { Nag, useGetUserInfo } from "ui/hooks/users";
import {
  isTeamLeaderInvite,
  isTeamMemberInvite,
  hasTeamInvitationCode,
} from "ui/utils/environment";
import LaunchButton from "../shared/LaunchButton";
const UserOptions = require("ui/components/Header/UserOptions").default;

function Header({
  nonPendingWorkspaces,
  currentWorkspaceId,
  setModal,
}: {
  nonPendingWorkspaces: Workspace[];
  currentWorkspaceId: string | null;
  setModal: (modal: ModalType) => void;
}) {
  const onSettingsClick = () => {
    setModal("workspace-settings");
  };

  return (
    <div id="header">
      <div className="header-left space-x-0">
        {currentWorkspaceId == null ? null : (
          <a
            href="#"
            onClick={onSettingsClick}
            className="flex flex-row ml-4 items-center text-gray-400 hover:text-gray-800"
          >
            <CogIcon className="h-8 w-8" />
          </a>
        )}

        <WorkspaceDropdown nonPendingWorkspaces={nonPendingWorkspaces} />
      </div>
      <div className="flex-auto" />
      <LaunchButton />
      <UserOptions mode="account" noBrowserItem />
    </div>
  );
}

function LibraryLoader(props: PropsFromRedux) {
  const [renderLibrary, setRenderLibrary] = useState(false);
  const { workspaces, loading: loading1 } = hooks.useGetNonPendingWorkspaces();
  const { pendingWorkspaces, loading: loading2 } = hooks.useGetPendingWorkspaces();
  const { nags, loading: loading3 } = useGetUserInfo();
  const claimTeamInvitationCode = hooks.useClaimTeamInvitationCode(onCompleted);

  function onCompleted() {
    // This allows the server enough time to refresh the pending workspaces
    // with the new team before we render the Library.
    setTimeout(() => {
      window.history.pushState({}, document.title, window.location.pathname);
      setRenderLibrary(true);
    }, 1000);
  }
  useEffect(function handleTeamInvitationCode() {
    const code = hasTeamInvitationCode();

    if (!code) {
      setRenderLibrary(true);
      return;
    }

    claimTeamInvitationCode({ variables: { code } });
  }, []);

  if (loading1 || loading2 || loading3 || !renderLibrary) {
    return null;
  }

  return <Library {...{ ...props, workspaces, pendingWorkspaces, nags }} />;
}

type LibraryProps = PropsFromRedux & {
  workspaces: Workspace[];
  pendingWorkspaces?: Workspace[];
  nags: Nag[];
};

function Library({
  setWorkspaceId,
  setModal,
  currentWorkspaceId,
  workspaces,
  pendingWorkspaces,
  nags,
}: LibraryProps) {
  const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();

  useEffect(function handleDeletedTeam() {
    // After rendering null, update the workspaceId to display the user's library
    // instead of the non-existent team.
    if (![{ id: null }, ...workspaces].some(ws => ws.id === currentWorkspaceId)) {
      setWorkspaceId(null);
      updateDefaultWorkspace({ variables: { workspaceId: null } });
    }
  }, []);
  useEffect(function handleOnboardingModals() {
    const isLinkedFromEmail = isTeamMemberInvite() || isTeamLeaderInvite();

    if (isTeamLeaderInvite()) {
      setModal("team-leader-onboarding");
    } else if (pendingWorkspaces?.length) {
      setModal("team-member-onboarding");
    }

    if (!isLinkedFromEmail && !hasTeamInvitationCode && !nags.includes(Nag.FIRST_REPLAY)) {
      setModal("onboarding");
    }
  }, []);

  // Handle cases where the default workspace ID in prefs is for a team
  // that the user is no longer a part of. This occurs when the user is removed
  // from a team that is stored as their default library team in prefs. We return
  // null here, and reset the currentWorkspaceId to the user's library in `handleDeletedTeam`.
  if (![{ id: null }, ...workspaces].find(ws => ws.id === currentWorkspaceId)) {
    return null;
  }

  return (
    <>
      <Header
        nonPendingWorkspaces={workspaces}
        setModal={setModal}
        currentWorkspaceId={currentWorkspaceId}
      />
      <Dashboard />
    </>
  );
}

const connector = connect(
  (state: UIState) => ({
    currentWorkspaceId: selectors.getWorkspaceId(state),
  }),
  {
    setWorkspaceId: actions.setWorkspaceId,
    setModal: actions.setModal,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(LibraryLoader);
