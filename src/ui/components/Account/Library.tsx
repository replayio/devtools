import React, { useEffect } from "react";
import Dashboard from "../Dashboard/index";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { actions } from "ui/actions";
import WorkspaceDropdown from "../Dashboard/Navigation/WorkspaceDropdown";
import { Workspace } from "ui/types";
import { CogIcon } from "@heroicons/react/solid";
import { ModalType } from "ui/state/app";
import { UIState } from "ui/state";
import { selectors } from "ui/reducers";
import { Nag, useGetUserInfo } from "ui/hooks/users";
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
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();

  useEffect(() => {
    // After rendering null, update the workspaceId to display the user's library
    // instead of the non-existent team.
    if (!loading && ![{ id: null }, ...workspaces].find(ws => ws.id === currentWorkspaceId)) {
      setWorkspaceId(null);
    }
  }, [workspaces, loading]);

  useEffect(() => {
    if (!loading && userInfo?.nags && !userInfo.nags.includes(Nag.FIRST_REPLAY)) {
      setModal("onboarding");
    }
  }, [userInfo]);

  if (loading) {
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
