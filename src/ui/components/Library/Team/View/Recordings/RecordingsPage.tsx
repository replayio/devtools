import { useContext } from "react";
import Viewer from "ui/components/Library/Viewer";
import Base64Image from "ui/components/shared/Base64Image";
import hooks from "ui/hooks";
import { TeamContext } from "../../TeamPage";

export function RecordingsPage() {
  const { teamId } = useContext(TeamContext);
  const team = useContext(TeamContext).team!;
  const FILTER = "";
  const { recordings, loading } = hooks.useGetWorkspaceRecordings(teamId, FILTER);

  if (loading || !recordings) {
    return null;
  }

  return (
    <Viewer
      recordings={recordings}
      // workspaceName={team?.logo ? <Base64Image src={team.logo} className="max-h-12" /> : team.name}
      workspaceName={"butts"}
    />
  );
}
