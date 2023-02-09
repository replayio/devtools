import { Object as ProtocolObject } from "@replayio/protocol";
import React, { createContext, useEffect, useMemo, useState } from "react";

import { TestItem } from "shared/graphql/types";
import { useTestInfo } from "ui/hooks/useTestInfo";
import { getSelectedTest, setSelectedTest } from "ui/reducers/reporter";
import { setPlaybackFocusRegion } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import ContextMenuWrapper from "./ContextMenu";
import { StepDetails } from "./StepDetails";
import { TestCase } from "./TestCase";
import { TestInfoContextMenuContextRoot } from "./TestInfoContextMenuContext";
import styles from "./TestInfo.module.css";

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
            {missingSteps ? (
              <aside className={styles.aside}>
                <div>
                  <strong>👋 Hey there!</strong>
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
          {selectedTest !== null && info.supportsStepAnnotations ? <StepDetails /> : null}
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
