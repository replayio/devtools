import { useContext } from "react";

import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";
import hooks from "ui/hooks";

import { TeamContext } from "../../TeamContextRoot";
import { FilterContext } from "../FilterContext";
import { TestResults } from "./TestResults";

export function TestResultsPage() {
  return (
    <div className="flex flex-grow flex-col space-y-2 overflow-auto p-4">
      <TestResultsContent />
    </div>
  );
}

// This is currently mostly derived from the existing Recordings component(s).
// We should reconsider exactly how we want to think about displaying test results.
function TestResultsContent() {
  const { teamId } = useContext(TeamContext);
  const { filter } = useContext(FilterContext);
  const { recordings, loading } = hooks.useGetWorkspaceRecordings(teamId, filter);

  if (loading) {
    return (
      <div className="flex flex-grow flex-col overflow-hidden p-4">
        <LibrarySpinner />
      </div>
    );
  }

  return <TestResults recordings={recordings} />;
}
