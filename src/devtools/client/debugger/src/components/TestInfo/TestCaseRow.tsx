import classnames from "classnames";

import { TestItem, TestStep } from "shared/graphql/types";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { setSelectedTest } from "ui/reducers/reporter";
import { useAppDispatch } from "ui/setup/hooks";

import { Status } from "./TestCase";

function formatStepError(step?: TestStep) {
  if (!step || !step.error || !step.args) {
    return null;
  }

  return (
    <>
      <strong className="bold">Error:</strong>&nbsp;
      {step.args.map((e, i) => (typeof e === "string" ? <span key={i}>{e}&nbsp;</span> : null))}
    </>
  );
}

export function TestCaseRow({ test, index }: { test: TestItem; index: number }) {
  const dispatch = useAppDispatch();
  const expandable = !!test.steps;

  const toggleExpand = () => {
    dispatch(setSelectedTest({ index, title: test.title }));
  };

  return (
    <button
      className={classnames(
        "flex flex-row items-center justify-between gap-1 rounded-lg p-1 transition",
        {
          "group hover:cursor-pointer": expandable,
        }
      )}
      onClick={toggleExpand}
      disabled={!expandable}
    >
      <div className="flex flex-grow flex-row gap-1 overflow-hidden">
        <Status result={test.result} />
        <div className="flex flex-col items-start text-bodyColor">
          <div
            className={`overflow-hidden overflow-ellipsis whitespace-pre ${"group-hover:underline"}`}
          >
            {test.title}
          </div>
          {test.error ? (
            <div
              className="mt-2 overflow-hidden rounded-lg bg-testsuitesErrorBgcolor px-3 py-2 text-left font-mono"
              data-test-id="TestSuite-TestCaseRow-Error"
            >
              {formatStepError(test.steps?.find(s => s.error)) || test.error.message}
            </div>
          ) : null}
        </div>
      </div>
      <div className="invisible flex self-start group-hover:visible">
        <MaterialIcon>chevron_right</MaterialIcon>
      </div>
    </button>
  );
}
