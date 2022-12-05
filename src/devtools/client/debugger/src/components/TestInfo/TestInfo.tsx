import { Object as ProtocolObject } from "@replayio/protocol";
import cloneDeep from "lodash/cloneDeep";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import ErrorBoundary from "bvaughn-architecture-demo/components/ErrorBoundary";
import PropertiesRenderer from "bvaughn-architecture-demo/components/inspector/PropertiesRenderer";
import {
  getReporterAnnotationsForTests,
  getSelectedTest,
  setSelectedTest,
} from "ui/reducers/reporter";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { TestItem } from "ui/types";

import ContextMenuWrapper from "./ContextMenu";
import { TestCase } from "./TestCase";
import { TestInfoContextMenuContextRoot } from "./TestInfoContextMenuContext";

type TestInfoContextType = {
  consoleProps?: ProtocolObject;
  setConsoleProps: (obj?: ProtocolObject) => void;
  pauseId: string | null;
  setPauseId: (id: string | null) => void;
};

export const TestInfoContext = createContext<TestInfoContextType>(null as any);

export default function TestInfo({ testCases }: { testCases: TestItem[] }) {
  const dispatch = useAppDispatch();
  const selectedTest = useAppSelector(getSelectedTest);
  const [consoleProps, setConsoleProps] = useState<ProtocolObject>();
  const [pauseId, setPauseId] = useState<string | null>(null);
  const annotations = useAppSelector(getReporterAnnotationsForTests);

  const showTest = (index: number) => {
    return selectedTest === null || selectedTest === index;
  };

  useEffect(() => {
    if (testCases.length === 1) {
      dispatch(setSelectedTest(0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!annotations) {
    return (
      <div className="flex flex-grow flex-col overflow-hidden">
        <div className="flex flex-grow flex-col space-y-1 overflow-auto px-2">Loading...</div>
      </div>
    );
  }

  return (
    <TestInfoContext.Provider value={{ consoleProps, setConsoleProps, pauseId, setPauseId }}>
      <TestInfoContextMenuContextRoot>
        <div className="flex flex-grow flex-col overflow-hidden">
          <div className="flex flex-grow flex-col space-y-1 overflow-auto px-2 ">
            {testCases.map((t, i) => showTest(i) && <TestCase test={t} key={i} index={i} />)}
          </div>
          {selectedTest ? <Console /> : null}
          <ContextMenuWrapper />
        </div>
      </TestInfoContextMenuContextRoot>
    </TestInfoContext.Provider>
  );
}

function Console() {
  const { pauseId, consoleProps } = useContext(TestInfoContext);

  const sanitizedConsoleProps = useMemo(() => {
    const sanitized = cloneDeep(consoleProps);
    if (sanitized?.preview?.properties) {
      sanitized.preview.properties = sanitized.preview.properties.filter(
        p => p.name !== "Snapshot"
      );
    }

    return sanitized;
  }, [consoleProps]);

  const hideProps = !pauseId || !sanitizedConsoleProps;

  return (
    <div
      className="h-100 flex h-64 flex-shrink-0 flex-col overflow-auto py-2"
      style={{
        borderTop: "2px solid var(--chrome)",
      }}
      key={pauseId}
    >
      <div
        className="text-md p-2 px-4"
        style={{
          fontSize: "15px",
        }}
      >
        Step Details
      </div>
      <ErrorBoundary>
        <div className="flex flex-grow flex-col gap-1 py-2 font-mono">
          {hideProps ? (
            <div className="flex flex-grow items-center justify-center align-middle text-xs opacity-50">
              Nothing Selected...
            </div>
          ) : (
            <PropertiesRenderer pauseId={pauseId} object={sanitizedConsoleProps} />
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
}
