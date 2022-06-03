import { useContext } from "react";
import { useGetRecording } from "ui/hooks/recordings";
import { useGetTestRunForWorkspace } from "ui/hooks/tests";
import { getRelativeDate } from "../RecordingRow";
import { TestsContext } from "./Tests";

export function TestTooltip() {
  const { hoveredRecordingId, hoveredRunId } = useContext(TestsContext);
  const { recording, loading: recordingLoading } = useGetRecording(hoveredRecordingId);
  const { testRun, loading: testRunLoading } = useGetTestRunForWorkspace(hoveredRunId!);

  if (recordingLoading || testRunLoading || !recording || !testRun) {
    return null;
  }

  const passed = testRun.recordings
    .map(r => r.metadata.test?.result)
    .filter(r => r === "passed").length;
  const failed = testRun.recordings
    .map(r => r.metadata.test?.result)
    .filter(r => r === "failed").length;

  return (
    <div className="absolute bottom-0 w-48 p-2 mb-8 text-xs bg-white rounded-md shadow-md">
      <div>Trigger: {recording.metadata?.source?.trigger?.name} </div>
      <div>Test run: {recording.metadata?.source?.commit?.title} </div>
      <div>Branch: {recording.metadata?.source?.branch} </div>
      <div>Date: {getRelativeDate(recording.date)}</div>
      <div>
        Passed: {passed} Failed: {failed}
      </div>
    </div>
  );
}