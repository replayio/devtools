import { useContext } from "react";
import { useSimulateListQuery } from "ui/utils/library";
import { ViewContext } from "../ViewPage";

export function RecordingsPage() {
  return (
    <div className="flex flex-col flex-grow p-4 space-y-2 overflow-auto bg-rose-200">
      <RecordingsContent />
    </div>
  );
}

function RecordingsContent() {
  const { view } = useContext(ViewContext);
  const { results, loading } = useSimulateListQuery(view);

  if (loading) {
    return <div>Loading</div>;
  }

  return (
    <>
      {results.map((_, i) => (
        <div className="p-4 bg-rose-300" key={i}>
          Recording {i}
        </div>
      ))}
    </>
  );
}
