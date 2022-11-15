import { useMemo, useState } from "react";

import { getRecordingDuration } from "ui/actions/app";
import { setFocusRegion } from "ui/actions/timeline";
import { useFetchCypressSpec } from "ui/hooks/useFetchCypressSpec";
import { Annotation, getReporterAnnotations } from "ui/reducers/reporter";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { TestItem } from "ui/types";

import { TestCase } from "./TestCase";

function maybeCorrectTestTimes(testCases: TestItem[], annotations: Annotation[]) {
  return testCases.map((t, i) => ({
    ...t,
    relativeStartTime: annotations?.[i]?.time ? annotations?.[i]?.time : t.relativeStartTime,
  }));
}

export default function TestInfo({ testCases }: { testCases: TestItem[] }) {
  const [highlightedTest, setHighlightedTest] = useState<number | null>(null);
  const dispatch = useAppDispatch();
  const annotations = useAppSelector(getReporterAnnotations);
  const cypressResults = useFetchCypressSpec();
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
        <button onClick={onReset}>Show all ({testCases.length}) tests</button>
      )}
      {correctedTestCases.map(
        (t, i) =>
          showTest(i) && (
            <TestCase
              test={t}
              key={i}
              location={cypressResults?.[i]?.location}
              setHighlightedTest={() => setHighlightedTest(i)}
              isHighlighted={i === highlightedTest}
            />
          )
      )}
    </div>
  );
}
