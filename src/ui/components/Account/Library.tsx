import React, { useEffect } from "react";
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
import { isOpenedFromEmail } from "ui/utils/environment";
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
      <UserOptions mode="account" />
    </div>
  );
}

function Library({ setWorkspaceId, setModal, currentWorkspaceId }: PropsFromRedux) {
  const userInfo = useGetUserInfo();
  const { workspaces, loading: loading1 } = hooks.useGetNonPendingWorkspaces();
  const { pendingWorkspaces, loading: loading2 } = hooks.useGetPendingWorkspaces();

  useEffect(() => {
    // After rendering null, update the workspaceId to display the user's library
    // instead of the non-existent team.
    if (!loading2 && ![{ id: null }, ...workspaces].find(ws => ws.id === currentWorkspaceId)) {
      setWorkspaceId(null);
    }
  }, [workspaces, loading2]);

  useEffect(() => {
    // Wait for both queries to finish loading
    if (loading1 || loading2) {
      return;
    }

    // Only show the team member onboarding modal if there's only one outstanding pending team.
    if (isOpenedFromEmail() && pendingWorkspaces?.length === 1) {
      setModal("team-member-onboarding");
      // Skip showing the regular onboarding to make sure the new user lands in the right team first.
      return;
    }

    if (!isOpenedFromEmail() && userInfo?.nags && !userInfo.nags.includes(Nag.FIRST_REPLAY)) {
      setModal("onboarding");
    }
  }, [userInfo, loading1, loading2]);

  if (loading1 || loading2) {
    return null;
  }

  // Handle cases where the default workspace ID in prefs is for a team
  // that the user is no longer a part of. This occurs when the user is removed
  // from a team that is stored as their default library team in prefs. We return
  // null here, and reset the currentWorkspaceId to the user's library in `useEffect`.
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
export default connector(Library);
