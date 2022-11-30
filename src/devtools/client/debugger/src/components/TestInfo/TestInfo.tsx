import { Object as ProtocolObject } from "@replayio/protocol";
import React, { createContext, useContext, useMemo, useState } from "react";

import ErrorBoundary from "bvaughn-architecture-demo/components/ErrorBoundary";
import PropertiesRenderer from "bvaughn-architecture-demo/components/inspector/PropertiesRenderer";
import { getRecordingDuration } from "ui/actions/app";
import { setFocusRegion } from "ui/actions/timeline";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getReporterAnnotationsForTests } from "ui/reducers/reporter";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { Annotation, TestItem } from "ui/types";

import { TestCase } from "./TestCase";

type TestInfoContextType = {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  consoleProps?: ProtocolObject;
  setConsoleProps: (obj?: ProtocolObject) => void;
  pauseId: string | null;
  setPauseId: (id: string | null) => void;
};

export const TestInfoContext = createContext<TestInfoContextType>(null as any);

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
  const [consoleProps, setConsoleProps] = useState<ProtocolObject>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pauseId, setPauseId] = useState<string | null>(null);
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
    setPauseId(null);
    setConsoleProps(undefined);
  };

  return (
    <TestInfoContext.Provider
      value={{ selectedId, setSelectedId, consoleProps, setConsoleProps, pauseId, setPauseId }}
    >
      <div className="flex flex-grow flex-col overflow-hidden">
        <div className="flex flex-grow flex-col space-y-1 overflow-auto px-2 py-2">
          {highlightedTest !== null && (
            <button
              onClick={onReset}
              className="flex flex-row items-center hover:underline"
              style={{ fontSize: "15px" }}
            >
              <MaterialIcon>chevron_left</MaterialIcon>
              <div>{correctedTestCases[highlightedTest].title}</div>
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
        {highlightedTest ? <Console /> : null}
      </div>
    </TestInfoContext.Provider>
  );
}

function Console() {
  const { pauseId, consoleProps } = useContext(TestInfoContext);
  const hideProps = !pauseId || !consoleProps;

  return (
    <div
      className="h-100 flex h-64 flex-shrink-0 flex-col overflow-auto p-4"
      style={{
        borderTop: "2px solid var(--chrome)",
      }}
    >
      <div
        className="text-md"
        style={{
          fontSize: "15px",
        }}
      >
        Console Props
      </div>
      <ErrorBoundary>
        <div className="flex flex-grow flex-col gap-1 p-2 pl-8 font-mono">
          {hideProps ? (
            <div className="flex flex-grow items-center justify-center align-middle text-xs opacity-50">
              Nothing Selected...
            </div>
          ) : (
            <PropertiesRenderer pauseId={pauseId} object={consoleProps} />
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
}
