import { ReactNode, useTransition } from "react";

import { TestItem } from "shared/graphql/types";
import { setTimelineToTime } from "ui/actions/timeline";
import DropDownMenu from "ui/components/TestSuite/views/TestItem/DropDownMenu";
import { useAppDispatch } from "ui/setup/hooks";

import { ProcessedTestMetadata, ProcessedTestStep } from "../../types";
import AnnotatedTestStepRow from "./TestSteps/AnnotatedTestStepRow";
import NavigationTestStepRow from "./TestSteps/NavigationTestStepRow";
import NetworkTestStepRow from "./TestSteps/NetworkTestStepRow";
import { Position } from "./types";
import styles from "./TestCaseSectionRow.module.css";

export function TestCaseSectionRow({
  selectedTestStep,
  selectTestStep,
  testItem,
  testItemStartTime,
  testMetadata,
  testStep,
}: {
  selectedTestStep: ProcessedTestStep | null;
  selectTestStep: (testStep: ProcessedTestStep) => void;
  testItem: TestItem;
  testItemStartTime: number;
  testMetadata: ProcessedTestMetadata;
  testStep: ProcessedTestStep;
}) {
  const dispatch = useAppDispatch();

  const [isPending, startTransition] = useTransition();

  let position: Position = "after";
  if (selectedTestStep) {
    if (selectedTestStep.time === testStep.time) {
      position = "current";
    } else {
      position = testStep.time < selectedTestStep.time ? "before" : "after";
    }
  }

  let child: ReactNode;
  let status;
  switch (testStep.type) {
    case "navigation":
      child = <NavigationTestStepRow navigationTestStep={testStep} />;
      break;
    case "network":
      child = <NetworkTestStepRow networkTestStep={testStep} />;
      break;
    case "step":
      child = (
        <AnnotatedTestStepRow position={position} testMetadata={testMetadata} testStep={testStep} />
      );
      status = testStep.data.error ? "error" : "success";
      break;
    default:
      throw Error(`Unknown test step type: "${(testStep as any).type}"`);
  }

  const onMouseEnter = async () => {
    if (selectedTestStep !== testStep) {
      dispatch(setTimelineToTime(testStep.time));
    }
  };

  const onMouseLeave = () => {
    if (selectedTestStep !== testStep) {
      dispatch(setTimelineToTime(null));
    }
  };

  return (
    <div
      className={styles.Row}
      data-is-pending={isPending || undefined}
      data-position={position}
      data-status={status}
      data-type={testStep.type}
      data-test-name="TestCaseSectionRow"
      onClick={() => {
        startTransition(() => {
          selectTestStep(testStep);
        });
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {child}
      {position === "current" && (
        <DropDownMenu
          testItem={testItem}
          testItemStartTime={testItemStartTime}
          testMetadata={testMetadata}
          testStep={testStep}
        />
      )}
    </div>
  );
}
