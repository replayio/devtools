import { useShowTestStepBoundary } from "ui/components/TestSuite/hooks/useShowTestStepBoundary";
import { ProcessedTestStep } from "ui/components/TestSuite/types";
import { getSelectedTestStep } from "ui/reducers/reporter";
import { useAppSelector } from "ui/setup/hooks";

import styles from "./ToggleButton.module.css";

export default function ToggleButton() {
  const testStep = useAppSelector(getSelectedTestStep);

  // Definitely don't show the toggle button for network or navigation steps,
  // as we know these have a 0 duration.
  if (testStep === null || testStep.type === "network" || testStep.type === "navigation") {
    return null;
  }

  // Now that we're confident in the data TS type, double-check in case any
  // other test step somehow has a 0 duration
  const { duration = 0 } = testStep.data;

  if (duration === 0) {
    return null;
  }

  return <ToggleButtonInner testStep={testStep} />;
}

function ToggleButtonInner({ testStep }: { testStep: ProcessedTestStep }) {
  const { disabled: disabledShowAfter, onClick: onClickShowAfter } = useShowTestStepBoundary({
    boundary: "after",
    testStep,
  });
  const { disabled: disabledShowBefore, onClick: onClickShowBefore } = useShowTestStepBoundary({
    boundary: "before",
    testStep,
  });

  return (
    <div className={styles.ToggleWrapper}>
      <div className={styles.ToggleContainer}>
        <Button onClick={onClickShowBefore} active={disabledShowBefore}>
          Before
        </Button>
        <Button onClick={onClickShowAfter} active={disabledShowAfter}>
          After
        </Button>
      </div>
    </div>
  );
}

function Button({
  children,
  active,
  onClick,
}: {
  children: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button className={`${styles.ToggleButton} ${active ? styles.Active : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}
