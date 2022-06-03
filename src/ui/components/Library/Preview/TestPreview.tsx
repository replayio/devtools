import { useContext, useState } from "react";
import { useGetTestForWorkspace } from "ui/hooks/tests";
import { LibraryContext } from "../useFilters";
import { ReplayRow, ReplayRows } from "./ReplayRows";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { Recording } from "ui/types";

export function TestPreview() {
  const { preview } = useContext(LibraryContext);
  const { test, loading } = useGetTestForWorkspace(preview!.id as string[]);

  if (!test || loading) {
    return <>Loading…</>;
  }

  const mostRecentFailure = test.recordings.find(r => r.metadata.test?.result === "failed");

  return (
    <>
      <div className="flex flex-col space-y-2">
        <div className="flex flex-row items-center space-x-2 text-xl">
          <div>{test.title}</div>
        </div>
        <div className="flex flex-row space-x-2">
          <div className="flex flex-row items-center space-x-1">
            <MaterialIcon>web_asset</MaterialIcon>
            <div>{test.path[1]}</div>
          </div>
          <div className="flex flex-row items-center space-x-1">
            <MaterialIcon>description</MaterialIcon>
            <div>{test.path[test.path.length - 2]}</div>
          </div>
        </div>
      </div>
      <div className="space-y-2 overflow-auto">
        {mostRecentFailure ? <MostRecentFailure recording={mostRecentFailure} /> : null}
        <ReplayRows recordings={test.recordings} />
      </div>
    </>
  );
}

function MostRecentFailure({ recording }: { recording: Recording }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <span className="space-x-2">
        <span className="font-medium">Most Recent Failure</span>
        <button className="underline" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Hide" : "Show"}
        </button>
      </span>
      {expanded ? <ReplayRow recording={recording} /> : null}
    </div>
  );
}
