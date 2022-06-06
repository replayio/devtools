import { useGetRecording } from "ui/hooks/recordings";
import { useGetTestRunForWorkspace } from "ui/hooks/tests";
import { getTruncatedRelativeDate } from "../../RecordingRow";

export function TestTooltip({ recordingId, runId }: { recordingId: string; runId: string }) {
  const { recording, loading: recordingLoading } = useGetRecording(recordingId);
  const { testRun, loading: testRunLoading } = useGetTestRunForWorkspace(runId);

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
      <div>Date: {getTruncatedRelativeDate(recording.date)}</div>
      <div>
        Passed: {passed} Failed: {failed}
      </div>
    </div>
  );
}
