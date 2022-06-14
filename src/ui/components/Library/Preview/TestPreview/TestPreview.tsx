import { useContext } from "react";
import { useGetTestForWorkspace } from "ui/hooks/tests";
import { LibraryContext } from "../../useFilters";
import { ReplayList } from "./ReplayList";

export function TestPreview() {
  const { preview } = useContext(LibraryContext);
  const { test, loading } = useGetTestForWorkspace(preview!.id as string[]);

  if (!test || loading) {
    return <>Loading…</>;
  }

  // const mostRecentFailure = test.recordings.find(r => r.metadata.test?.result === "failed");

  return (
    <>
      <div className="flex flex-col p-4 space-y-2 border-b">
        <div className="flex flex-row items-center space-x-2 text-xl">
          <div>{test.path[test.path.length - 1]}</div>
        </div>
        <div className="flex flex-row space-x-2">
          <div className="flex flex-row items-center space-x-1">
            <div>{test.path[test.path.length - 2]}</div>
          </div>
        </div>
      </div>
      <ReplayList recordings={test.recordings} />
    </>
  );
}
