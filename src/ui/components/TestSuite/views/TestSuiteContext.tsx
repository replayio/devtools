import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { TestEvent, TestRecording } from "shared/test-suites/RecordingTestMetadata";

type TestSuiteContextType = {
  setTestRecording: (value: TestRecording | null) => Promise<void>;
  setTestEvent: (value: TestEvent | null) => void;
  testEvent: TestEvent | null;
  testRecording: TestRecording | null;
};

export const TestSuiteContext = createContext<TestSuiteContextType>(null as any);

export function TestSuiteContextRoot({ children }: PropsWithChildren) {
  const { updateForTimelineImprecise: zoom } = useContext(FocusContext);
  const { duration } = useContext(SessionContext);
  const { update: seekToTime } = useContext(TimelineContext);

  const [testEvent, setTestEvent] = useState<TestEvent | null>(null);
  const [testRecording, setTestRecording] = useState<TestRecording | null>(null);

  const setTestRecordingWrapper = useCallback(
    async (testRecording: TestRecording | null) => {
      setTestRecording(testRecording);

      if (testRecording != null) {
        const { timeStampedPointRange } = testRecording;

        if (timeStampedPointRange !== null) {
          await zoom([timeStampedPointRange.begin.time, timeStampedPointRange.end.time], {
            bias: "begin",
            debounce: false,
            sync: true,
          });

          seekToTime(timeStampedPointRange.begin.time, timeStampedPointRange.begin.point, false);
        }
      } else {
        await zoom([0, duration], {
          bias: "begin",
          debounce: false,
          sync: true,
        });
      }
    },
    [duration, seekToTime, zoom]
  );

  const value = useMemo(
    () => ({
      setTestEvent,
      setTestRecording: setTestRecordingWrapper,
      testEvent,
      testRecording,
    }),
    [setTestRecordingWrapper, testEvent, testRecording]
  );

  return <TestSuiteContext.Provider value={value}>{children}</TestSuiteContext.Provider>;
}
