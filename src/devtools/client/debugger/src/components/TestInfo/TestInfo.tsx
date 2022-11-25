import { useMemo } from "react";

import { getRecordingDuration } from "ui/actions/app";
import { setFocusRegion } from "ui/actions/timeline";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { Annotation, getReporterAnnotationsForTests } from "ui/reducers/reporter";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { TestItem } from "ui/types";

import { TestCase } from "./TestCase";

function maybeCorrectTestTimes(testCases: TestItem[], annotations: Annotation[]) {
  return testCases.map((t, i) => ({
    ...t,
    relativeStartTime: annotations?.[i]?.time ? annotations?.[i]?.time : t.relativeStartTime,
  }));
}

export default function TestInfo({
  testCases,
  highlightedTest,
  setHighlightedTest,
}: {
  testCases: TestItem[];
  highlightedTest: number | null;
  setHighlightedTest: (test: number | null) => void;
}) {
  const dispatch = useAppDispatch();
  const annotations = useAppSelector(getReporterAnnotationsForTests);
  const duration = useAppSelector(getRecordingDuration);

  // The test start times in metadata may be incorrect. If we have the reporter annotations,
  // we can use those instead
  const correctedTestCases = useMemo(
    () => maybeCorrectTestTimes(testCases, annotations),
    [testCases, annotations]
  );

  const showTest = (index: number) => {
    return highlightedTest === null || highlightedTest === index;
  };

  const onReset = () => {
    setHighlightedTest(null);
    dispatch(
      setFocusRegion({
        beginTime: 0,
        endTime: duration,
      })
    );
  };

  return (
    <div className="flex flex-col space-y-1 px-4 py-2">
      {highlightedTest !== null && (
        <button onClick={onReset} className="flex flex-row items-center hover:underline">
          <MaterialIcon>chevron_left</MaterialIcon>
          <div>Back</div>
        </button>
      )}
      {correctedTestCases.map(
        (t, i) =>
          showTest(i) && (
            <TestCase
              test={t}
              key={i}
              setHighlightedTest={() => setHighlightedTest(i)}
              isHighlighted={i === highlightedTest}
            />
          )
      )}
    </div>
  );
}
