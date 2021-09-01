import React, { ChangeEvent, Dispatch, SetStateAction, useEffect, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";
import LogRocket from "ui/utils/logrocket";
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
  removeUrlParameters,
} from "ui/utils/environment";
import LaunchButton from "../shared/LaunchButton";
import { setExpectedError } from "ui/actions/session";
import UserOptions from "ui/components/Header/UserOptions";
import { LoadingScreen } from "../shared/BlankScreen";
import Sidebar from "./Sidebar";
import ViewerRouter from "./ViewerRouter";
import LaunchReplayButton from "./LaunchReplayButton";
import { TextInput } from "../shared/Forms";

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

function Header({
  nonPendingWorkspaces,
  currentWorkspaceId,
  setModal,
}: {
  nonPendingWorkspaces: Workspace[];
  currentWorkspaceId: string | null;
  setModal: (modal: ModalType) => void;
}) {
  const onSettingsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setModal("workspace-settings");
  };

  return (
    <div id="header">
      <div className="header-left">
        {currentWorkspaceId == null ? null : (
          <a
            href="#"
            onClick={onSettingsClick}
            className="flex flex-row ml-3 items-center text-gray-400 hover:text-gray-800"
          >
            <CogIcon className="h-6 w-6" />
          </a>
        )}

        <WorkspaceDropdown nonPendingWorkspaces={nonPendingWorkspaces} />
      </div>
      <div className="flex-grow h-full" />
      <LaunchButton />
      <UserOptions noBrowserItem />
    </div>
  );
}

function LibraryLoader(props: PropsFromRedux) {
  const [renderLibrary, setRenderLibrary] = useState(false);
  const [showClaimError, setShowClaimError] = useState(false);

  const auth = useAuth0();
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
    if (!userInfo.loading) {
      LogRocket.createSession({ userInfo, auth0User: auth.user });
    }
  }, [auth, userInfo]);

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
      } else {
        setModal("team-member-onboarding");
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
  if (![{ id: null }, ...workspaces].find(ws => ws.id === currentWorkspaceId)) {
    return <LoadingScreen />;
  }

  return (
    <main className="flex flex-row w-full h-full">
      {<Sidebar nonPendingWorkspaces={workspaces} />}
      <div className="flex flex-col flex-grow overflow-x-hidden">
        <div className="flex flex-row h-16 border-b border-gray-300 items-center p-5 bg-white space-x-3">
          <FilterBar searchString={searchString} setSearchString={setSearchString} />
          <LaunchReplayButton />
        </div>
        <ViewerRouter
          workspaceName={
            currentWorkspaceId
              ? workspaces.find(ws => ws.id === currentWorkspaceId)!.name
              : "Your Library"
          }
          searchString={searchString}
        />
        {/* <Dashboard /> */}
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
