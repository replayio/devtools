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
import PortalDropdown from "../shared/PortalDropdown";
import { Dropdown, DropdownItem } from "./LibraryDropdown";
import LoadingScreen from "../shared/LoadingScreen";
import Sidebar from "./Sidebar";
import ViewerRouter from "./ViewerRouter";
import { TextInput } from "../shared/Forms";
import LaunchButton from "../shared/LaunchButton";
import { trackEvent } from "ui/utils/telemetry";
import styles from "./Library.module.css";
import {
  downloadReplay,
  firstReplay,
  isTeamLeaderInvite,
  singleInvitation,
} from "ui/utils/onboarding";
import { useRouter } from "next/router";
import { LibraryFiltersContext, useFilters } from "./Filter";

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

function FilterDropdown({
  setSearchString,
}: {
  setSearchString: (str: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  
  const setStringAndCollapseDropdown = (str: string) => {
    setSearchString(str);
    setExpanded(false);
  }
  const handleCreatedSince = (days: number) => {
    const secondsAgo = 1000 * 60 * 60 * 24 * days;
    const isoString = new Date(new Date().getTime() - secondsAgo).toISOString().substr(0, 10);
    return setStringAndCollapseDropdown(`created:${isoString}`);
  };

  const button = (
    <div className="text-sm flex border border-textFieldBorder bg-themeTextFieldBgcolor px-2.5 py-1.5 text-themeTextFieldColor rounded-md space-x-2">
      <div className="text-sm">Filter</div>
      <div className="material-icons text-sm">expand_more</div>
    </div>
  );

  return (
    <PortalDropdown
      buttonContent={button}
      buttonStyle={`flex flex-grow flex-row items-center text-sm text-gray-500 ${styles.librarySearch}`}
      setExpanded={setExpanded}
      expanded={expanded}
      position="top-right"
      distance={0}
    >
      <Dropdown menuItemsClassName="z-50">
        <DropdownItem onClick={() => setStringAndCollapseDropdown("")}>All Replays</DropdownItem>
        <DropdownItem onClick={() => handleCreatedSince(7)}>Last 7 days</DropdownItem>
        <DropdownItem onClick={() => setStringAndCollapseDropdown("target:node")}>Node replays</DropdownItem>
      </Dropdown>
    </PortalDropdown>
  )
}

function FilterBar({
  searchString,
  setSearchString,
}: {
  searchString: string;
  setSearchString: (str: string) => void;
}) {
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchString(e.target.value);
  };

  return (
    <>
      <FilterDropdown setSearchString={setSearchString} />
      <TextInput value={searchString} onChange={onChange} placeholder="Search" />
    </>
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
  const { displayedSearchString, filters, setFilterString } = useFilters();
  const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();
  const dismissNag = hooks.useDismissNag();

  // TODO [jaril] Fix react-hooks/exhaustive-deps
  useEffect(function handleDeletedTeam() {
    // After rendering null, update the workspaceId to display the user's library
    // instead of the non-existent team.
    if (![{ id: null }, ...workspaces].some(ws => ws.id === currentWorkspaceId)) {
      setWorkspaceId(null);
      updateDefaultWorkspace({ variables: { workspaceId: null } });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // TODO [jaril] Fix react-hooks/exhaustive-deps
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    <LibraryFiltersContext.Provider value={filters}>
      <main className="flex h-full w-full flex-row">
        <Sidebar nonPendingWorkspaces={workspaces} />
        <div className="flex flex-grow flex-col overflow-x-hidden">
          <div className={`flex h-16 flex-row items-center space-x-3 p-5 ${styles.libraryHeader}`}>
            <FilterBar searchString={displayedSearchString} setSearchString={setFilterString} />
            <LaunchButton />
          </div>
          <ViewerRouter />
        </div>
      </main>
    </LibraryFiltersContext.Provider>
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
