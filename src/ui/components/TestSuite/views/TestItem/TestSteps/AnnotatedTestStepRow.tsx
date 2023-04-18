import { Suspense, memo, useContext, useMemo } from "react";

import { getExecutionPoint } from "devtools/client/debugger/src/selectors";
import Loader from "replay-next/components/Loader";
import useSuspendAfterMount from "replay-next/src/hooks/useSuspendAfterMount";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { JumpToCodeButton } from "ui/components/shared/JumpToCodeButton";
import { useJumpToSource } from "ui/components/TestSuite/hooks/useJumpToSource";
import { getConsolePropsCountSuspense } from "ui/components/TestSuite/suspense/consoleProps";
import { AnnotatedTestStep, ProcessedTestMetadata } from "ui/components/TestSuite/types";
import { Position } from "ui/components/TestSuite/views/TestItem/types";
import { useAppSelector } from "ui/setup/hooks";

import styles from "./AnnotatedTestStepRow.module.css";

export default memo(function AnnotatedTestStepRow({
  position,
  testMetadata,
  testStep,
}: {
  position: Position;
  testMetadata: ProcessedTestMetadata;
  testStep: AnnotatedTestStep;
}) {
  const { annotations, args, error, index, name } = testStep.data;

  const executionPoint = useAppSelector(getExecutionPoint);

  const argsString = useMemo(() => {
    if (args) {
      return args.filter(arg => typeof arg === "string").join(" ");
    }
    return "";
  }, [args]);

  const { disabled, onClick } = useJumpToSource({ testMetadata, testStep });

  const showBadge = testStep.data.name === "get";

  return (
    <div className={styles.Row} data-status={error ? "error" : "success"}>
      <div className={styles.Text}>
        <span className={styles.Number}>{index + 1}</span>{" "}
        <span className={`${styles.Name} ${styles.Name}`} data-name={name} title={name}>
          {name}
        </span>{" "}
        <span className={`${styles.Args} ${styles.Args}`} title={argsString}>
          {argsString}
        </span>
      </div>
      {showBadge && (
        <Suspense fallback={<Loader />}>
          <Badge testStep={testStep} position={position} />
        </Suspense>
      )}
      {position === "current" && (
        <div className={styles.JumpToCodeButton}>
          <JumpToCodeButton
            currentExecutionPoint={executionPoint}
            disabled={disabled}
            onClick={onClick}
            status="not_checked"
            targetExecutionPoint={annotations.start!.point}
          />
        </div>
      )}
    </div>
  );
});

function Badge({ testStep, position }: { testStep: AnnotatedTestStep; position: Position }) {
  const client = useContext(ReplayClientContext);

  const count = useSuspendAfterMount(() => getConsolePropsCountSuspense(client, testStep));
  if (count === null) {
    return count;
  }

  return (
    <div className={position === "current" ? styles.SelectedBadge : styles.Badge}>{count}</div>
  );
}
