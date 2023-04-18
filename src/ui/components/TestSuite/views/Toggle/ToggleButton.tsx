import { useShowTestStepBoundary } from "ui/components/TestSuite/hooks/useShowTestStepBoundary";
import { ProcessedTestStep } from "ui/components/TestSuite/types";
import { getSelectedTestStep } from "ui/reducers/reporter";
import { useAppSelector } from "ui/setup/hooks";

import styles from "./ToggleButton.module.css";

export default function ToggleButton() {
  const testStep = useAppSelector(getSelectedTestStep);
  if (testStep === null) {
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
