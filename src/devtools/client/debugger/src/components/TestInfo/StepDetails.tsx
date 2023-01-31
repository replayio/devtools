import classNames from "classnames";
import React, { useContext, useEffect } from "react";

import ErrorBoundary from "replay-next/components/ErrorBoundary";
import PropertiesRenderer from "replay-next/components/inspector/PropertiesRenderer";
import useLocalStorage from "replay-next/src/hooks/useLocalStorage";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { useTestInfo } from "ui/hooks/useTestInfo";

import { getCypressConsolePropsSuspense } from "./getCypressConsolePropsSuspense";

function ConsoleProps({ open }: { open: boolean }) {
  const client = useContext(ReplayClientContext);
  const { selectedStep } = useTestInfo();

  const { pauseId, consoleProps } = getCypressConsolePropsSuspense(client, selectedStep) || {};

  return (
    <div
      className={`flex flex-grow flex-col gap-1 overflow-y-auto p-2 font-mono transition-all  ${
        open ? "visible" : "hidden"
      }`}
    >
      <div
        className={classNames(`flex flex-grow flex-col gap-1 p-2 font-mono`, {
          "items-center justify-center": !consoleProps || !selectedStep,
        })}
      >
        {!selectedStep ? (
          <span>Select a step above to view its details</span>
        ) : pauseId && consoleProps ? (
          <PropertiesRenderer pauseId={pauseId} object={consoleProps} />
        ) : (
          <span>Unable to retrieve step details for this step</span>
        )}
      </div>
    </div>
  );
}

export function StepDetails() {
  const { selectedTest } = useTestInfo();

  const [showStepDetails, setShowStepDetails] = useLocalStorage<boolean>(
    `Replay:TestInfo:StepDetails`,
    true
  );

  const errorFallback = (
    <div className="flex flex-grow items-center justify-center align-middle font-mono text-xs opacity-50">
      Failed to load step info
    </div>
  );

  const loadingFallback = (
    <div className="flex flex-grow items-center justify-center align-middle text-xs opacity-50">
      Loading ...
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
        key={selectedTest ? selectedTest.id : "no-selected-test"}
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
          <React.Suspense fallback={loadingFallback}>
            <ConsoleProps open={showStepDetails} />
          </React.Suspense>
        </ErrorBoundary>
      </div>
    </>
  );
}
