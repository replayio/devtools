import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { GroupedTestCases, TestEvent, TestRecording } from "shared/test-suites/types";
import { TestSuiteCache } from "ui/components/TestSuite/suspense/TestSuiteCache";

type TestSuiteContextType = {
  groupedTestCases: GroupedTestCases | null;
  setTestRecording: (value: TestRecording | null) => Promise<void>;
  setTestEvent: (value: TestEvent | null) => void;
  testEvent: TestEvent | null;
  testRecording: TestRecording | null;
};

export const TestSuiteContext = createContext<TestSuiteContextType>(null as any);

export function TestSuiteContextRoot({ children }: PropsWithChildren) {
  const { updateForTimelineImprecise: zoom } = useContext(FocusContext);
  const replayClient = useContext(ReplayClientContext);
  const { recordingId } = useContext(SessionContext);
  const { update: seekToTime } = useContext(TimelineContext);

  const [groupedTestCases, setGroupedTestCases] = useState<GroupedTestCases | null>(null);
  const [testEvent, setTestEvent] = useState<TestEvent | null>(null);
  const [testRecording, setTestRecording] = useState<TestRecording | null>(null);

  useEffect(() => {
    async function fetchGroupedTestCases() {
      const groupedTestCases = await TestSuiteCache.readAsync(replayClient, recordingId);

      setGroupedTestCases(groupedTestCases);
    }

    fetchGroupedTestCases();
  }, [recordingId, replayClient]);

  const setTestRecordingWrapper = useCallback(
    async (testRecording: TestRecording | null) => {
      setTestRecording(testRecording);

      if (testRecording != null) {
        const { timeStampedPointRange } = testRecording;

        await zoom([timeStampedPointRange.begin.time, timeStampedPointRange.end.time], {
          bias: "begin",
          debounce: false,
          sync: true,
        });

        seekToTime(timeStampedPointRange.begin.time, timeStampedPointRange.begin.point, false);
      }
    },
    [seekToTime, zoom]
  );

  const value = useMemo(
    () => ({
      groupedTestCases,
      setTestEvent,
      setTestRecording: setTestRecordingWrapper,
      testEvent,
      testRecording,
    }),
    [groupedTestCases, setTestRecordingWrapper, testEvent, testRecording]
  );

  return <TestSuiteContext.Provider value={value}>{children}</TestSuiteContext.Provider>;
}
