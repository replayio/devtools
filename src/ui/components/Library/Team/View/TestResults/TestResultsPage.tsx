import { useContext, useState } from "react";
import hooks from "ui/hooks";
import { TeamContext } from "../../TeamContext";
import { FilterContext } from "../FilterContext";
import { TestResults } from "./TestResults";

export function TestResultsPage() {
  return (
    <div className="flex flex-col flex-grow p-4 space-y-2 overflow-auto">
      <TestResultsContent />
    </div>
  );
}

// This is currently mostly derived from the existing Recordings component(s).
// We should reconsider exactly how we want to think about displaying test results.
function TestResultsContent() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { teamId } = useContext(TeamContext);
  const { filter } = useContext(FilterContext);
  const { recordings, loading } = hooks.useGetWorkspaceRecordings(teamId, filter);

  if (loading) {
    // TODO: Add a proper loading state indicator here -jaril.
    return <div />;
  }

  return (
    <TestResults
      isEditing={false}
      recordings={recordings}
      selectedIds={selectedIds}
      setSelectedIds={setSelectedIds}
    />
  );
}
