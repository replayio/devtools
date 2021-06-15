import React, { useEffect, useState } from "react";
import Dashboard from "../Dashboard/index";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import * as actions from "ui/actions/app";
import WorkspaceDropdown from "../Dashboard/Navigation/WorkspaceDropdown";
import { UserSettings, Workspace } from "ui/types";
import { CogIcon } from "@heroicons/react/solid";
import { ModalType } from "ui/state/app";
import { UIState } from "ui/state";
import * as selectors from "ui/reducers/app";
import { Nag, useGetUserInfo } from "ui/hooks/users";
import { isTeamLeaderInvite, isTeamMemberInvite } from "ui/utils/environment";
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

function LibraryLoader(props: PropsFromRedux) {
  const [renderLibrary, setRenderLibrary] = useState(false);
  const { userSettings, loading: loading1 } = hooks.useGetUserSettings();
  const { workspaces, loading: loading2 } = hooks.useGetNonPendingWorkspaces();
  const { pendingWorkspaces, loading: loading3 } = hooks.useGetPendingWorkspaces();
  const { nags, loading: loading4 } = useGetUserInfo();

  useEffect(() => {
    if (loading1 || loading2 || loading3 || loading4) {
      return;
    }

    // Make sure the user's default workspace is in the store before rendering
    // the library so we can route them properly.
    props.setWorkspaceId(userSettings.defaultWorkspaceId);
    setRenderLibrary(true);
  }, [loading1, loading2, loading3, loading4]);

  if (!renderLibrary) {
    return null;
  }

  return <Library {...{ ...props, userSettings, workspaces, pendingWorkspaces, nags }} />;
}

type LibraryProps = PropsFromRedux & {
  nags: Nag[];
  pendingWorkspaces?: Workspace[];
  workspaces: Workspace[];
};

function Library({
  nags,
  pendingWorkspaces,
  workspaces,
  setWorkspaceId,
  setModal,
  currentWorkspaceId,
}: LibraryProps) {
  const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();
  const currentWorkspaceExists = [{ id: null }, ...workspaces].some(
    ws => ws.id === currentWorkspaceId
  );

  useEffect(() => {
    // After rendering null, update the workspaceId to display the user's library
    // instead of the non-existent team.
    if (!currentWorkspaceExists) {
      setWorkspaceId(null);
      updateDefaultWorkspace({ variables: { workspaceId: null } });
    }
  }, [workspaces]);
  useEffect(function handleOnboardingModals() {
    const isLinkedFromEmail = isTeamMemberInvite() || isTeamLeaderInvite();

    if (isTeamLeaderInvite()) {
      setModal("team-leader-onboarding");
    } else if (pendingWorkspaces?.length === 1) {
      setModal("team-member-onboarding");
    }

    if (!isLinkedFromEmail && nags && !nags.includes(Nag.FIRST_REPLAY)) {
      setModal("onboarding");
    }
  }, []);

  // Handle cases where the default workspace ID in prefs is for a team
  // that the user is no longer a part of. This occurs when the user is removed
  // from a team that is stored as their default library team in prefs. We return
  // null here, and reset the currentWorkspaceId to the user's library in `useEffect`.
  if (!currentWorkspaceExists) {
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
