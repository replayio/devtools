import { useContext } from "react";

import { Workspace } from "shared/graphql/types";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";
import { NonPendingTeamScreen } from "ui/components/Library/Team/View/Recordings/NonPendingTeam";
import hooks from "ui/hooks";

import { MY_LIBRARY_TEAM, TeamContext } from "../../TeamContextRoot";
import { FilterContext } from "../FilterContext";
import { PendingTeamScreen } from "./PendingTeam/PendingTeamScreen";
import { RecordingsPageViewer } from "./RecordingsPageViewer";

export function RecordingsPage() {
  const { teamId, team } = useContext(TeamContext);

  return teamId === MY_LIBRARY_TEAM.id ? (
    <MyRecordingsPage team={team as typeof MY_LIBRARY_TEAM} />
  ) : (
    <TeamRecordingsPage team={team as Workspace} />
  );
}

function MyRecordingsPage({ team }: { team: typeof MY_LIBRARY_TEAM }) {
  const { filter } = useContext(FilterContext);
  const { recordings, loading } = hooks.useGetPersonalRecordings(filter);

  if (loading || !recordings) {
    return (
      <div className="flex flex-grow flex-col overflow-hidden p-4">
        <LibrarySpinner />
      </div>
    );
  }

  return <RecordingsPageViewer recordings={recordings} workspaceName={team.name} />;
}

// Not a big fan of how we handle pending teams here, but we're hoisted by
// our own petard. The complexity is coming from the fact that we're trying
// to display a non-workspace as a workspace.
// TODO: Think of an alternative way to display pending workspaces that doesn't
// require us having to display them like an actual workspace. I named this
// atrociously so that it's easier to find all the references to it when we file
// a follow up.
function TeamRecordingsPage({ team }: { team: Workspace }) {
  const { teamId, isPendingTeam } = useContext(TeamContext);
  const { pendingWorkspaces, loading } = hooks.useGetPendingWorkspaces();

  if (loading || !pendingWorkspaces) {
    return null;
  }

  if (isPendingTeam) {
    const workspace = pendingWorkspaces.find(w => w.id === teamId);
    return <PendingTeamScreen workspace={workspace!} />;
  } else {
    return <NonPendingTeamScreen team={team} />;
  }
}
