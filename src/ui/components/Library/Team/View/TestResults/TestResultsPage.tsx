import { useContext } from "react";
import { useSimulateListQuery } from "ui/utils/library";
import { ViewContext } from "../ViewContext";

export function TestResultsPage() {
  return (
    <div className="flex flex-col flex-grow p-4 space-y-2 overflow-auto bg-green-200">
      <TestResultsContent />
    </div>
  );
}

function TestResultsContent() {
  const { view } = useContext(ViewContext);
  const { results, loading } = useSimulateListQuery(view);

  if (loading) {
    return <div>Loading</div>;
  }

  return (
    <>
      {/* {results.map((_, i) => (
        <div className="p-4 bg-green-300" key={i}>
          Test Results {i}
        </div>
      ))} */}
    </>
  );
}
