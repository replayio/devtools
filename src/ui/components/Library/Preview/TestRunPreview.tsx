import { useContext } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useGetTestRunForWorkspace } from "ui/hooks/tests";
import { getFormattedTime } from "ui/utils/timeline";
import { getRelativeDate, ItemScreenshot } from "../RecordingRow";
import { LibraryContext } from "../useFilters";
import { TestRunReplayRows } from "./TestRunReplayRows";

export function TestRunPreview() {
  const { preview } = useContext(LibraryContext);
  const { testRun, loading } = useGetTestRunForWorkspace(preview!.id as string);

  if (!testRun || loading) {
    return <>Loading…</>;
  }

  const firstRecording = testRun.recordings[0];
  console.log({ firstRecording });

  return (
    <>
      <div className="flex flex-col space-y-2">
        <div className="flex flex-row items-center space-x-2 text-xl">
          <div>{testRun.commit?.title}</div>
          <div>({testRun.commit?.id})</div>
        </div>
        <div className="flex flex-row space-x-2">
          {/* {firstRecording.metadata.source?.merge ? (
            <div>
              Pull Request: {firstRecording.metadata.source.merge.title} (#
              {firstRecording.metadata.source.merge.id})
            </div>
          ) : null} */}
          <div className="flex items-center space-x-1">
            <MaterialIcon>play_circle</MaterialIcon>
            <span>{testRun.event}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MaterialIcon>timer</MaterialIcon>
            <span>{getRelativeDate(firstRecording.date)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MaterialIcon>fork_right</MaterialIcon>
            <span>{firstRecording.metadata.source?.branch || "Unknown branch"}</span>
          </div>
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
      </div>
      <TestRunReplayRows recordings={testRun.recordings} />
    </>
  );
}
