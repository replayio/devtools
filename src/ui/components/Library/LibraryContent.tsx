import { useContext } from "react";
import { TestRunsViewer } from "./Content/TestRuns/TestRunsViewer";
import RecordingsRouter from "./Content/Recordings/RecordingsRouter";
import { LibraryContext } from "./useFilters";

export function LibraryContent() {
  const { view } = useContext(LibraryContext);

  return view === "recordings" ? <RecordingsRouter /> : <TestRunsViewer />;
}
