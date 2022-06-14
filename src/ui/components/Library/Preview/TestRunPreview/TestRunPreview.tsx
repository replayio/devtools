import { useContext } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useGetTestRunForWorkspace } from "ui/hooks/tests";
import { getTruncatedRelativeDate } from "../../RecordingRow";
import { LibraryContext } from "../../useFilters";
import { ReplayList } from "./ReplayList";

export function TestRunPreview() {
  const { preview } = useContext(LibraryContext);
  const { testRun, loading } = useGetTestRunForWorkspace(preview!.id as string);

  if (!testRun || loading) {
    return <>Loading…</>;
  }

  const results = testRun.recordings.map(r => r.metadata?.test?.result);
  const user = testRun.recordings[0].metadata.source?.trigger?.user;
  const firstRecording = testRun.recordings[0];

  return (
    <>
      <div className="flex flex-col p-4 space-y-2 border-b">
        <div className="flex flex-row items-center space-x-2 text-xl">
          <div>{testRun.commit?.title}</div>
          <div>({testRun.commit?.id})</div>
        </div>
        <div className="flex flex-row items-center space-x-2">
          <div className="flex items-center space-x-1">
            <MaterialIcon>play_circle</MaterialIcon>
            <span>{testRun.event}</span>
          </div>

          <div className="flex items-center space-x-1">
            <MaterialIcon>timer</MaterialIcon>
            <span>{getTruncatedRelativeDate(firstRecording.date)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MaterialIcon>fork_right</MaterialIcon>
            <span>{firstRecording.metadata.source?.branch || "Unknown branch"}</span>
          </div>
          {!!user && (
            <img
              title={user}
              className="w-5 h-5 rounded-full"
              src={`https://github.com/${user}.png`}
            />
          )}
          {firstRecording.metadata.source?.merge ? (
            <div
              className="flex flex-row items-center space-x-1"
              title={firstRecording.metadata.source.merge.title}
            >
              <MaterialIcon>tag</MaterialIcon>
              <div>{firstRecording.metadata.source.merge.id}</div>
            </div>
          ) : null}
        </div>
        <div className="flex flex-row space-x-2">
          <div className="flex items-center py-1 space-x-0.5 text-green-500 rounded-full">
            <MaterialIcon iconSize="xl">check_circle</MaterialIcon>
            <div>{`${results.filter(r => r === "passed").length}`}</div>
          </div>
          {results.filter(r => r === "failed").length === 0 ? null : (
            <div className="flex items-center py-1 space-x-0.5 text-red-500 rounded-full">
              <MaterialIcon iconSize="xl">error</MaterialIcon>
              <div>{`${results.filter(r => r === "failed").length}`}</div>
            </div>
          )}
        </div>
      </div>
      <ReplayList recordings={testRun.recordings} />
    </>
  );
}
