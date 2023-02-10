import { Object as ProtocolObject } from "@replayio/protocol";
import React, { createContext, useEffect, useState } from "react";

import { TestItem } from "shared/graphql/types";
import { useTestInfo } from "ui/hooks/useTestInfo";
import { getSelectedTest, setSelectedTest } from "ui/reducers/reporter";
import { setPlaybackFocusRegion } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import ContextMenuWrapper from "./ContextMenu";
import { MissingSteps } from "./MissingSteps";
import { StepDetails } from "./StepDetails";
import { TestCase } from "./TestCase";
import { TestCaseTree } from "./TestCaseTree";
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
  const info = useTestInfo();

  const missingSteps =
    !info.loading && info.supportsSteps && !testCases.some(t => t.steps && t.steps.length > 0);

  useEffect(() => {
    dispatch(setPlaybackFocusRegion(!!selectedTest));
  }, [dispatch, selectedTest]);

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

  return (
    <TestInfoContext.Provider
      value={{ loading, setLoading, consoleProps, setConsoleProps, pauseId, setPauseId }}
    >
      <TestInfoContextMenuContextRoot>
        <div className="flex flex-grow flex-col overflow-hidden">
          <div className="relative flex flex-grow flex-col space-y-1 overflow-auto border-t border-splitter px-2 pt-3">
            {missingSteps ? <MissingSteps /> : null}
            {selectedTest == null ? (
              <TestCaseTree testCases={testCases} />
            ) : (
              <TestCase test={testCases[selectedTest]} />
            )}
          </div>
          {selectedTest !== null && info.supportsStepAnnotations ? <StepDetails /> : null}
          <ContextMenuWrapper />
        </div>
      </TestInfoContextMenuContextRoot>
    </TestInfoContext.Provider>
  );
}
