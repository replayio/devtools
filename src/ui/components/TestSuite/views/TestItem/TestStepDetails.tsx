import { Suspense, useContext } from "react";

import PropertiesRenderer from "replay-next/components/inspector/PropertiesRenderer";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import ErrorBoundary from "ui/components/ErrorBoundary";
import { getConsolePropsSuspense } from "ui/components/TestSuite/suspense/consoleProps";
import { AnnotatedTestStep, ProcessedTestStep } from "ui/components/TestSuite/types";

import styles from "./TestStepDetails.module.css";

export default function TestStepDetails({
  collapsed,
  processedTestStep,
}: {
  collapsed: boolean;
  processedTestStep: ProcessedTestStep | null;
}) {
  if (collapsed) {
    return null;
  } else if (processedTestStep == null || processedTestStep.type !== "step") {
    return <div className={styles.Message}>Select a step above to view its details</div>;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className={styles.Message}>Loading step details...</div>}>
        <TestStepDetailsSuspends processedTestStep={processedTestStep} />
      </Suspense>
    </ErrorBoundary>
  );
}

function TestStepDetailsSuspends({ processedTestStep }: { processedTestStep: AnnotatedTestStep }) {
  const client = useContext(ReplayClientContext);

  const { consoleProps, pauseId } = getConsolePropsSuspense(client, processedTestStep) || {};
  if (consoleProps == null || pauseId == null) {
    return <div className={styles.Message}>Unable to retrieve step details for this step</div>;
  }

  return (
    <div className={styles.Container}>
      <PropertiesRenderer pauseId={pauseId} object={consoleProps} />
    </div>
  );
}
