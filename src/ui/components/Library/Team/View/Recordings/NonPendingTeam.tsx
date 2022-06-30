import React, { useContext } from "react";
import { Workspace } from "ui/types";
import Base64Image from "ui/components/shared/Base64Image";
import { TeamContext } from "../../TeamContext";
import { FilterContext } from "../FilterContext";
import hooks from "ui/hooks";
import { RecordingsPageViewer } from "./RecordingsPageViewer";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";

export function NonPendingTeamScreen({ team }: { team: Workspace }) {
  const { teamId } = useContext(TeamContext);
  const { filter } = useContext(FilterContext);
  const { recordings, loading } = hooks.useGetWorkspaceRecordings(teamId, filter);

  if (!team || loading) {
    return (
      <div className="flex flex-col flex-grow p-4 overflow-hidden">
        <LibrarySpinner />
      </div>
    );
  }

  return (
    <RecordingsPageViewer
      recordings={recordings}
      workspaceName={team?.logo ? <Base64Image src={team.logo} className="max-h-12" /> : team.name}
    />
  );
}
