import classNamesBind from "classnames/bind";
import React, { useEffect, useRef } from "react";

import { TestItem } from "shared/graphql/types";
import { useTestInfo } from "ui/hooks/useTestInfo";
import { getSelectedTest } from "ui/reducers/reporter";
import { setPlaybackFocusRegion } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import useWidthObserver from "ui/utils/useWidthObserver";

import ContextMenuWrapper from "./ContextMenu";
import { MissingSteps } from "./MissingSteps";
import { StepDetails } from "./StepDetails";
import { TestCase } from "./TestCase";
import { TestCaseTree } from "./TestCaseTree";
import { TestInfoContextMenuContextRoot } from "./TestInfoContextMenuContext";
import styles from "./TestInfo.module.css";

const classNames = classNamesBind.bind(styles);

export default function TestInfo({ testCases }: { testCases: TestItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const selectedTest = useAppSelector(getSelectedTest);
  const info = useTestInfo();
  const widthObserver = useWidthObserver(ref);

  const missingSteps =
    !info.loading && info.supportsSteps && !testCases.some(t => t.steps && t.steps.length > 0);

  useEffect(() => {
    dispatch(setPlaybackFocusRegion(!!selectedTest));
  }, [dispatch, selectedTest]);

  // useEffect(() => {
  //   if (testCases.length === 1) {
  //     dispatch(
  //       setSelectedTest({
  //         index: 0,
  //         title: testCases[0].title,
  //       })
  //     );
  //   }
  // }, [testCases, dispatch]);

  return (
    <TestInfoContextMenuContextRoot>
      <div
        data-test-id="TestSuite-TestInfoPanel"
        ref={ref}
        className={classNames("flex flex-grow flex-col overflow-hidden", {
          narrow: !widthObserver || widthObserver < 400,
        })}
      >
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
  );
}
