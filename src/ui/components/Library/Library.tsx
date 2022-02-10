import React, { ChangeEvent, Dispatch, SetStateAction, useEffect, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import useAuth0 from "ui/utils/useAuth0";
import LogRocket from "ui/utils/logrocket";
import hooks from "ui/hooks";
import * as actions from "ui/actions/app";
import { Workspace } from "ui/types";
import { UIState } from "ui/state";
import * as selectors from "ui/reducers/app";
import { Nag, useGetUserInfo } from "ui/hooks/users";
import { removeUrlParameters } from "ui/utils/environment";
import { setExpectedError } from "ui/actions/session";
import LoadingScreen from "../shared/LoadingScreen";
import Sidebar from "./Sidebar";
import ViewerRouter from "./ViewerRouter";
import { TextInput } from "../shared/Forms";
import LaunchButton from "../shared/LaunchButton";
import { trackEvent } from "ui/utils/telemetry";
import {
  downloadReplay,
  firstReplay,
  hasTeamInvitationCode,
  isTeamLeaderInvite,
  singleInvitation,
} from "ui/utils/onboarding";
import { useRouter } from "next/router";

function isUnknownWorkspaceId(
  id: string | null,
  workspaces: Workspace[],
  pendingWorkspaces?: Workspace[]
) {
  const associatedWorkspaces = [{ id: null }, ...workspaces];

  // Add the pending workspaces, if any.
  if (pendingWorkspaces) {
    associatedWorkspaces.push(...pendingWorkspaces);
  }

  return !associatedWorkspaces.map(ws => ws.id).includes(id);
}

function FilterBar({
  searchString,
  setSearchString,
}: {
  searchString: string;
  setSearchString: Dispatch<SetStateAction<string>>;
}) {
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchString(e.target.value);
  };

  return (
    <div className="flex flex-grow flex-row items-center space-x-3 text-sm text-gray-500">
      <div className="material-icons">search</div>
      <TextInput value={searchString} onChange={onChange} placeholder="Search" />
    </div>
  );
}

function LibraryLoader(props: PropsFromRedux) {
  const auth = useAuth0();
  const { userSettings, loading: userSettingsLoading } = hooks.useGetUserSettings();
  const userInfo = hooks.useGetUserInfo();
  const { workspaces, loading: loading1 } = hooks.useGetNonPendingWorkspaces();
  const { pendingWorkspaces, loading: loading2 } = hooks.useGetPendingWorkspaces();
  const { nags, loading: loading3 } = useGetUserInfo();

  useEffect(() => {
    if (!userInfo.loading && !userSettingsLoading) {
      LogRocket.createSession({ userInfo, auth0User: auth.user, userSettings });
    }
  }, [auth, userInfo, userSettings, userSettingsLoading]);

  if (loading1 || loading2 || loading3) {
    return <LoadingScreen />;
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
  const router = useRouter();
  const [searchString, setSearchString] = useState("");
  const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();
  const dismissNag = hooks.useDismissNag();

  useEffect(function handleDeletedTeam() {
    // After rendering null, update the workspaceId to display the user's library
    // instead of the non-existent team.
    if (![{ id: null }, ...workspaces].some(ws => ws.id === currentWorkspaceId)) {
      setWorkspaceId(null);
      updateDefaultWorkspace({ variables: { workspaceId: null } });
    }
  }, []);
  useEffect(function handleOnboardingModals() {
    if (singleInvitation(pendingWorkspaces?.length || 0, workspaces.length)) {
      trackEvent("onboarding.team_invite");
      setModal("single-invite");
    } else if (downloadReplay(nags, dismissNag)) {
      trackEvent("onboarding.download_replay_prompt");
      setModal("download-replay");
    } else if (firstReplay(nags)) {
      trackEvent("onboarding.demo_replay_prompt");
      setModal("first-replay");
    }
  }, []);

  // FIXME [ryanjduffy]: Backwards compatibility for ?replayinvite=true flow
  if (isTeamLeaderInvite()) {
    router.replace("/team/new");
    return null;
  }

  // Handle cases where the default workspace ID in prefs is for a team
  // that the user is no longer a part of. This occurs when the user is removed
  // from a team that is stored as their default library team in prefs. We return
  // null here, and reset the currentWorkspaceId to the user's library in `handleDeletedTeam`.
  // This also handles cases where the selected ID actually corresponds to a pending team.
  if (isUnknownWorkspaceId(currentWorkspaceId, workspaces, pendingWorkspaces)) {
    return <LoadingScreen />;
  }

  return (
    <main className="flex h-full w-full flex-row">
      <Sidebar nonPendingWorkspaces={workspaces} />
      <div className="flex flex-grow flex-col overflow-x-hidden">
        <div className="flex h-16 flex-row items-center space-x-3 border-b border-gray-300 bg-white p-5">
          <FilterBar searchString={searchString} setSearchString={setSearchString} />
          <LaunchButton />
        </div>
        <ViewerRouter searchString={searchString} />
      </div>
    </main>
  );
}

const connector = connect(
  (state: UIState) => ({
    currentWorkspaceId: selectors.getWorkspaceId(state),
  }),
  {
    setWorkspaceId: actions.setWorkspaceId,
    setModal: actions.setModal,
    setExpectedError,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(LibraryLoader);
