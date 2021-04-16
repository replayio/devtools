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
      <div className="header-left space-x-4">
        <WorkspaceDropdown nonPendingWorkspaces={nonPendingWorkspaces} />
        {currentWorkspaceId == null ? null : (
          <a
            href="#"
            onClick={onSettingsClick}
            className="flex flex-row space-x-3 items-center text-gray-700 hover:text-gray-900"
          >
            <CogIcon className="h-8 w-8" />
          </a>
        )}
      </div>
      <UserOptions mode="account" />
    </div>
  );
}

function Library({ setWorkspaceId, setModal, currentWorkspaceId }: PropsFromRedux) {
  const { userSettings, loading: settingsLoading } = hooks.useGetUserSettings();
  const {
    workspaces: nonPendingWorkspaces,
    loading: nonPendingLoading,
  } = hooks.useGetNonPendingWorkspaces();

  useEffect(() => {
    if (userSettings) {
      setWorkspaceId(userSettings.default_workspace_id);
    }
  }, [userSettings]);

  if (settingsLoading || nonPendingLoading) {
    return null;
  }

  return (
    <>
      <Header
        nonPendingWorkspaces={nonPendingWorkspaces}
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
