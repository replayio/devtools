import { useContext } from "react";
import { PendingTeamScreen } from "ui/components/Library/PendingTeamScreen";
import Viewer from "ui/components/Library/Viewer";
import Base64Image from "ui/components/shared/Base64Image";
import hooks from "ui/hooks";
import { Workspace } from "ui/types";
import { MY_LIBRARY_TEAM, TeamContext } from "../../TeamPage";
import { FilterContext } from "../FilterContext";

export function RecordingsPage() {
  const { teamId, team } = useContext(TeamContext);

  return teamId === "me" ? (
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

  return <Viewer recordings={recordings} workspaceName={team.name} />;
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
    return <NonPendingTeamLibrary team={team} />;
  }
}

function NonPendingTeamLibrary({ team }: { team: Workspace }) {
  const { teamId } = useContext(TeamContext);
  const { filter } = useContext(FilterContext);
  const { recordings, loading } = hooks.useGetWorkspaceRecordings(teamId, filter);

  if (loading) {
    // TODO: Add a proper loading state indicator here -jaril.
    return <div />;
  }

  return (
    <Viewer
      recordings={recordings}
      workspaceName={team?.logo ? <Base64Image src={team.logo} className="max-h-12" /> : team.name}
    />
  );
}
