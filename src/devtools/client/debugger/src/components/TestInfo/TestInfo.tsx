import { Object as ProtocolObject } from "@replayio/protocol";
import cloneDeep from "lodash/cloneDeep";
import React, { createContext, useContext, useMemo, useState } from "react";

import ErrorBoundary from "bvaughn-architecture-demo/components/ErrorBoundary";
import PropertiesRenderer from "bvaughn-architecture-demo/components/inspector/PropertiesRenderer";
import { getSelectedTest } from "ui/reducers/reporter";
import { useAppSelector } from "ui/setup/hooks";
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
  const selectedTest = useAppSelector(getSelectedTest);
  const [consoleProps, setConsoleProps] = useState<ProtocolObject>();
  const [pauseId, setPauseId] = useState<string | null>(null);

  const showTest = (index: number) => {
    return selectedTest === null || selectedTest === index;
  };

  return (
    <TestInfoContext.Provider value={{ consoleProps, setConsoleProps, pauseId, setPauseId }}>
      <TestInfoContextMenuContextRoot>
        <div className="flex flex-grow flex-col overflow-hidden">
          <div className="flex flex-grow flex-col space-y-1 overflow-auto px-2 ">
            {testCases.map((t, i) => showTest(i) && <TestCase test={t} key={i} index={i} />)}
          </div>
          {selectedTest !== null ? <Console /> : null}
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

      // suppress the prototype entry in the properties output
      sanitized.preview.prototypeId = undefined;
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
