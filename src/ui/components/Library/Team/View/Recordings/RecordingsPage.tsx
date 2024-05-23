import { useContext } from "react";

import { Workspace } from "shared/graphql/types";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";
import { NonPendingTeamScreen } from "ui/components/Library/Team/View/Recordings/NonPendingTeam";
import hooks from "ui/hooks";

import { MY_LIBRARY_TEAM, TeamContext } from "../../TeamContextRoot";
import { FilterContext } from "../FilterContext";
import { RecordingsPageViewer } from "./RecordingsPageViewer";

export function RecordingsPage() {
  const { teamId, team } = useContext(TeamContext);

  return teamId === MY_LIBRARY_TEAM.id ? (
    <MyRecordingsPage team={team as typeof MY_LIBRARY_TEAM} />
  ) : (
    <NonPendingTeamScreen team={team as Workspace} />
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
