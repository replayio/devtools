import React, { useContext } from "react";

import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";
import Base64Image from "ui/components/shared/Base64Image";
import hooks from "ui/hooks";
import { Workspace } from "ui/types";

import { TeamContext } from "../../TeamContextRoot";
import { FilterContext } from "../FilterContext";
import { RecordingsPageViewer } from "./RecordingsPageViewer";

export function NonPendingTeamScreen({ team }: { team: Workspace }) {
  const { teamId } = useContext(TeamContext);
  const { filter } = useContext(FilterContext);
  const { recordings, loading } = hooks.useGetWorkspaceRecordings(teamId, filter);

  if (!team || loading) {
    return (
      <div className="flex flex-grow flex-col overflow-hidden p-4">
        <LibrarySpinner />
      </div>
    );
  }

  return (
    <RecordingsPageViewer
      recordings={recordings}
      workspaceName={
        team?.logo ? (
          <Base64Image src={team.logo} format={team.logoFormat} className="max-h-12" />
        ) : (
          team.name
        )
      }
    />
  );
}
