import React, { ChangeEvent, Dispatch, SetStateAction, useEffect, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";
import LogRocket from "ui/utils/logrocket";
import hooks from "ui/hooks";
import * as actions from "ui/actions/app";
import { Workspace } from "ui/types";
import { UIState } from "ui/state";
import * as selectors from "ui/reducers/app";
import { Nag, useGetUserInfo } from "ui/hooks/users";
import {
  isTeamLeaderInvite,
  isTeamMemberInvite,
  hasTeamInvitationCode,
  removeUrlParameters,
} from "ui/utils/environment";
import { setExpectedError } from "ui/actions/session";
import { LoadingScreen } from "../shared/BlankScreen";
import Sidebar from "./Sidebar";
import ViewerRouter from "./ViewerRouter";
import { TextInput } from "../shared/Forms";
import LaunchButton from "../shared/LaunchButton";

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
    <div className="flex flex-row flex-grow text-gray-500 text-sm space-x-3 items-center">
      <div className="material-icons">search</div>
      <TextInput value={searchString} onChange={onChange} placeholder="Search" />
    </div>
  );
}

function LibraryLoader(props: PropsFromRedux) {
  const [renderLibrary, setRenderLibrary] = useState(false);
  const [showClaimError, setShowClaimError] = useState(false);

  const auth = useAuth0();
  const { userSettings, loading: userSettingsLoading } = hooks.useGetUserSettings();
  const userInfo = hooks.useGetUserInfo();
  const { workspaces, loading: loading1 } = hooks.useGetNonPendingWorkspaces();
  const { pendingWorkspaces, loading: loading2 } = hooks.useGetPendingWorkspaces();
  const { nags, loading: loading3 } = useGetUserInfo();
  const claimTeamInvitationCode = hooks.useClaimTeamInvitationCode(onCompleted, onError);

  function onCompleted() {
    // This allows the server enough time to refresh the pending workspaces
    // with the new team before we render the Library.
    setTimeout(() => {
      removeUrlParameters();
      setRenderLibrary(true);
    }, 1000);
  }
  function onError() {
    // If there's an error while claiming a code, don't go ahead and render the library.
    setShowClaimError(true);
  }

  useEffect(() => {
    if (!userInfo.loading && !userSettingsLoading) {
      LogRocket.createSession({ userInfo, auth0User: auth.user, userSettings });
    }
  }, [auth, userInfo, userSettings, userSettingsLoading]);

  useEffect(function handleTeamInvitationCode() {
    const code = hasTeamInvitationCode();

    if (!code) {
      setRenderLibrary(true);
      return;
    }

    claimTeamInvitationCode({ variables: { code } });
  }, []);
  useEffect(
    function handleInvalidTeamInvitationCode() {
      if (!showClaimError) {
        return;
      }

      props.setExpectedError({
        message: "This team invitation code is invalid",
        content:
          "There seems to be a problem with your team invitation link. Please ask your team administrator to send you an up-to-date link.",
        action: "library",
      });
    },
    [showClaimError]
  );

  if (loading1 || loading2 || loading3 || !renderLibrary) {
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
  const [searchString, setSearchString] = useState("");
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
      // Show the single invite modal to users who have just signed up for Replay
      // because they were invited to a team.
      if (pendingWorkspaces.length === 1 && workspaces.length === 0) {
        setModal("single-invite");
      }
    }

    const showFirstReplayTutorial =
      !nags.includes(Nag.FIRST_REPLAY_2) && window.__IS_RECORD_REPLAY_RUNTIME__;

    if (!isLinkedFromEmail && !hasTeamInvitationCode() && showFirstReplayTutorial) {
      setModal("first-replay");
    }
  }, []);

  // Handle cases where the default workspace ID in prefs is for a team
  // that the user is no longer a part of. This occurs when the user is removed
  // from a team that is stored as their default library team in prefs. We return
  // null here, and reset the currentWorkspaceId to the user's library in `handleDeletedTeam`.
  // This also handles cases where the selected ID actually corresponds to a pending team.
  if (isUnknownWorkspaceId(currentWorkspaceId, workspaces, pendingWorkspaces)) {
    return <LoadingScreen />;
  }

  return (
    <main className="flex flex-row w-full h-full">
      <Sidebar nonPendingWorkspaces={workspaces} />
      <div className="flex flex-col flex-grow overflow-x-hidden">
        <div className="flex flex-row h-16 border-b border-gray-300 items-center p-5 bg-white space-x-3">
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
