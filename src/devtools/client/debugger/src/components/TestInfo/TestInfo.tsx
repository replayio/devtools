import { Object as ProtocolObject } from "@replayio/protocol";
import cloneDeep from "lodash/cloneDeep";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import ErrorBoundary from "replay-next/components/ErrorBoundary";
import PropertiesRenderer from "replay-next/components/inspector/PropertiesRenderer";
import useLocalStorage from "replay-next/src/hooks/useLocalStorage";
import { useTestInfo } from "ui/hooks/useTestInfo";
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
  const info = useTestInfo();

  const missingSteps =
    !info.loading && info.supportsSteps && !testCases.some(t => t.steps && t.steps.length > 0);

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
            {missingSteps ? (
              <aside className="m-1 space-y-4 rounded-lg border border-amber-200 bg-amber-100 px-4 py-3">
                <div>
                  <strong>Hey there!</strong>
                </div>
                <div>
                  You seem to be missing test steps for this replay. You'll still be able to use the
                  core Replay tools but adding test steps will give you a much better debugging
                  experience.
                </div>
                {info.runner === "cypress" ? (
                  <div>
                    This usually means you need to include the{" "}
                    <code>@replayio/cypress/support</code> module in your project's support file.
                    More information is available in our{" "}
                    <a
                      className="underline"
                      href="https://docs.replay.io/recording-browser-tests-(beta)/cypress-instructions"
                      target="_blank"
                      rel="noreferrer"
                    >
                      docs
                    </a>
                    .
                  </div>
                ) : null}
                <div>
                  If you're stuck, reach out to us over{" "}
                  <a
                    className="underline"
                    href="mailto:support@replay.io"
                    target="_blank"
                    rel="noreferrer"
                  >
                    email
                  </a>{" "}
                  or{" "}
                  <a
                    href="https://replay.io/discord"
                    className="underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    discord
                  </a>{" "}
                  and we can help you get set up.
                </div>
              </aside>
            ) : null}
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
            className={`flex flex-grow flex-col gap-1 overflow-y-auto p-2 font-mono transition-all  ${
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
