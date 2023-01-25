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

  return (
    <TestInfoContext.Provider
      value={{ loading, setLoading, consoleProps, setConsoleProps, pauseId, setPauseId }}
    >
      <TestInfoContextMenuContextRoot>
        <div className="flex flex-grow flex-col overflow-hidden">
          <div className="relative flex flex-grow flex-col space-y-1 overflow-auto border-t border-splitter px-2 pt-3">
            {selectedTest == null ? (
              <TestCaseTree testCases={testCases} />
            ) : (
              <TestCase test={testCases[selectedTest]} index={selectedTest} />
            )}
          </div>
          {selectedTest !== null ? <Console /> : null}
          <ContextMenuWrapper />
        </div>
      </TestInfoContextMenuContextRoot>
    </TestInfoContext.Provider>
  );
}

interface TestTree {
  branches: Record<string, TestTree>;
  tests: { index: number; test: TestItem }[];
}

const createTree = () =>
  ({
    branches: {},
    tests: [],
  } as TestTree);

function TestCaseBranch({ name, tree }: { name?: string; tree: TestTree }) {
  const branchNames = Object.keys(tree.branches);
  const hasBranches = branchNames.length > 0;
  const hasTests = tree.tests.length > 0;

  if (!hasBranches && !hasTests) {
    return null;
  }

  return (
    <>
      {name ? <li className="p-1">{name}</li> : null}
      <ol className={name ? "ml-3" : undefined}>
        {branchNames.map(name => (
          <TestCaseBranch key={"branch-" + name} tree={tree.branches[name]} name={name} />
        ))}
        {tree.tests.map(t => (
          <TestCase key={t.index} test={t.test} index={t.index} />
        ))}
      </ol>
    </>
  );
}

function TestCaseTree({ testCases }: { testCases: TestItem[] }) {
  const tree = useMemo(
    () =>
      testCases.reduce((acc, t, i) => {
        let branch = acc;
        const describes = t.path?.slice(3, t.path.length - 1);

        describes?.forEach(d => {
          if (!branch.branches[d]) {
            branch.branches[d] = createTree();
          }

          branch = branch.branches[d];
        });

        branch.tests.push({ index: i, test: t });

        return acc;
      }, createTree()),
    [testCases]
  );

  return <TestCaseBranch tree={tree} />;
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
