import { Object as ProtocolObject } from "@replayio/protocol";
import cloneDeep from "lodash/cloneDeep";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import ErrorBoundary from "replay-next/components/ErrorBoundary";
import PropertiesRenderer from "replay-next/components/inspector/PropertiesRenderer";
import useLocalStorage from "replay-next/src/hooks/useLocalStorage";
import { getSelectedTest, setSelectedTest } from "ui/reducers/reporter";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { TestItem } from "ui/types";

import ContextMenuWrapper from "./ContextMenu";
import { TestCase } from "./TestCase";
import { TestInfoContextMenuContextRoot } from "./TestInfoContextMenuContext";

type TestInfoContextType = {
  consoleProps?: ProtocolObject;
  setConsoleProps: (obj?: ProtocolObject) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  pauseId: string | null;
  setPauseId: (id: string | null) => void;
};

export const TestInfoContext = createContext<TestInfoContextType>(null as any);

export default function TestInfo({ testCases }: { testCases: TestItem[] }) {
  const dispatch = useAppDispatch();
  const selectedTest = useAppSelector(getSelectedTest);
  const [consoleProps, setConsoleProps] = useState<ProtocolObject>();
  const [loading, setLoading] = useState<boolean>(true);
  const [pauseId, setPauseId] = useState<string | null>(null);

  useEffect(() => {
    if (testCases.length === 1) {
      dispatch(
        setSelectedTest({
          index: 0,
          title: testCases[0].title,
        })
      );
    }
  }, [testCases, dispatch]);

  const showTest = (index: number) => {
    return selectedTest === null || selectedTest === index;
  };

  return (
    <TestInfoContext.Provider
      value={{ loading, setLoading, consoleProps, setConsoleProps, pauseId, setPauseId }}
    >
      <TestInfoContextMenuContextRoot>
        <div className="flex flex-grow flex-col overflow-hidden">
          <div className="relative flex flex-grow flex-col space-y-1 overflow-auto border-t border-splitter px-2 pt-3">
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
  const { loading, pauseId, consoleProps } = useContext(TestInfoContext);

  const [showStepDetails, setShowStepDetails] = useLocalStorage<boolean>(
    `Replay:TestInfo:StepDetails`,
    true
  );

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

  const hideProps = !sanitizedConsoleProps;

  const errorFallback = (
    <div className="flex flex-grow items-center justify-center align-middle font-mono text-xs opacity-50">
      Failed to load step info
    </div>
  );

  return (
    <>
      <div
        className={`overflow-none flex flex-shrink-0 flex-col py-2 ${
          showStepDetails ? "h-64" : "h-12"
        } delay-0 duration-300 ease-in-out`}
        style={{
          borderTop: "1px solid var(--chrome)",
        }}
        key={pauseId || "no-pause-id"}
      >
        <div
          className="text-md var(--theme-tab-font-size) p-2  px-4 hover:cursor-pointer"
          onClick={() => setShowStepDetails(!showStepDetails)}
          style={{
            fontSize: "15px",
          }}
        >
          <div className="flex select-none items-center space-x-2">
            <div className={`img arrow ${showStepDetails ? "expanded" : null}`}></div>
            <span className="overflow-hidden overflow-ellipsis whitespace-pre">Step Details</span>
          </div>
        </div>

        <ErrorBoundary fallback={errorFallback}>
          <div
            className={`flex flex-grow flex-col gap-1 p-2 font-mono transition-all ${
              showStepDetails ? "visible" : "hidden"
            }`}
          >
            <div className={`flex flex-grow flex-col gap-1 p-2 font-mono`}>
              {loading ? (
                <div className="flex flex-grow items-center justify-center align-middle text-xs opacity-50">
                  Loading ...
                </div>
              ) : hideProps ? (
                errorFallback
              ) : (
                <PropertiesRenderer pauseId={pauseId!} object={sanitizedConsoleProps} />
              )}
            </div>
          </div>
        </ErrorBoundary>
      </div>
    </>
  );
}
