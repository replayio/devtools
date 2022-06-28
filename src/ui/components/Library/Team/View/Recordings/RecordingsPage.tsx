import { useContext } from "react";
import { NonPendingTeamScreen } from "ui/components/Library/Team/View/Recordings/NonPendingTeam";
import hooks from "ui/hooks";
import { Workspace } from "ui/types";
import { MY_LIBRARY_TEAM, TeamContext } from "../../TeamContext";
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
    return null;
  }

  return <RecordingsPageViewer recordings={recordings} workspaceName={team.name} />;
}

function TeamRecordingsPage({ team }: { team: Workspace }) {
  const { teamId } = useContext(TeamContext);
  const { pendingWorkspaces, loading } = hooks.useGetPendingWorkspaces();

  if (loading || !pendingWorkspaces) {
    return null;
  }

  const isPending = pendingWorkspaces?.some(w => w.id === teamId);

  if (isPending) {
    const workspace = pendingWorkspaces.find(w => w.id === teamId);
    return <PendingTeamScreen workspace={workspace!} />;
  } else {
    return <NonPendingTeamScreen team={team} />;
  }
}
