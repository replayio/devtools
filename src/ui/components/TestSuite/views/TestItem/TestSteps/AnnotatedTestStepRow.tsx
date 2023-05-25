import { Suspense, memo, useContext, useMemo, useState } from "react";
import { useImperativeCacheValue } from "suspense";

import { getExecutionPoint } from "devtools/client/debugger/src/selectors";
import Loader from "replay-next/components/Loader";
import useSuspendAfterMount from "replay-next/src/hooks/useSuspendAfterMount";
import { isExecutionPointsWithinRange } from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Annotations } from "shared/graphql/types";
import { jumpToKnownEventListenerHit } from "ui/actions/eventListeners/jumpToCode";
import { seek } from "ui/actions/timeline";
import { JumpToCodeButton, JumpToCodeStatus } from "ui/components/shared/JumpToCodeButton";
import { useJumpToSource } from "ui/components/TestSuite/hooks/useJumpToSource";
import { getConsolePropsCountSuspense } from "ui/components/TestSuite/suspense/consoleProps";
import { AnnotatedTestStep, ProcessedTestMetadata } from "ui/components/TestSuite/types";
import { Position } from "ui/components/TestSuite/views/TestItem/types";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { ParsedJumpToCodeAnnotation } from "ui/suspense/annotationsCaches";
import { eventListenersJumpLocationsCache } from "ui/suspense/annotationsCaches";

import styles from "./AnnotatedTestStepRow.module.css";

const NO_ANNOTATIONS: ParsedJumpToCodeAnnotation[] = [];

const cypressStepTypesToEventTypes = {
  click: "mousedown",
  type: "keypress",
} as const;

function findJumpToCodeDetailsIfAvailable(
  testMetadata: ProcessedTestMetadata,
  testStep: AnnotatedTestStep,
  testStepAnnotations: Annotations,
  jumpToCodeAnnotations: ParsedJumpToCodeAnnotation[]
) {
  let canShowJumpToCode = false;
  let jumpToCodeAnnotation: ParsedJumpToCodeAnnotation | undefined = undefined;

  if (testMetadata.runner?.name === "cypress" && "category" in testStep.data) {
    // TODO This is very Cypress-specific. Playwright steps have a `name` like `locator.click("blah")`.
    // We only care about click events and keyboard events. Keyboard events appear to be a "type" command,
    // as in "type this text into the input".
    canShowJumpToCode =
      "category" in testStep.data &&
      testStep.data.category === "command" &&
      (testStep.data.name === "click" || testStep.data.name === "type");

    if (canShowJumpToCode) {
      const eventKind =
        cypressStepTypesToEventTypes[
          testStep.data.name as keyof typeof cypressStepTypesToEventTypes
        ];

      const { start, end } = testStepAnnotations;

      if (eventKind && start && end) {
        jumpToCodeAnnotation = jumpToCodeAnnotations.find(a =>
          isExecutionPointsWithinRange(a.point, start.point, end.point)
        );
      }
    }
  }

  return [canShowJumpToCode, jumpToCodeAnnotation] as const;
}

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

  const dispatch = useAppDispatch();
  const executionPoint = useAppSelector(getExecutionPoint);
  const { status: annotationsStatus, value: parsedAnnotations } = useImperativeCacheValue(
    eventListenersJumpLocationsCache
  );

  const [isHovered, setIsHovered] = useState(false);

  const argsString = useMemo(() => {
    if (args) {
      return args.filter(arg => typeof arg === "string").join(" ");
    }
    return "";
  }, [args]);

  const { disabled: jumpToTestSourceDisabled, onClick: onClickJumpToTestSource } = useJumpToSource({
    testMetadata,
    testStep,
  });

  const jumpToCodeAnnotations: ParsedJumpToCodeAnnotation[] =
    annotationsStatus === "resolved" ? parsedAnnotations : NO_ANNOTATIONS;

  const [canShowJumpToCode, jumpToCodeAnnotation] = useMemo(() => {
    return findJumpToCodeDetailsIfAvailable(
      testMetadata,
      testStep,
      annotations,
      jumpToCodeAnnotations
    );
  }, [jumpToCodeAnnotations, testStep, annotations, testMetadata]);

  const onJumpToClickEvent = async () => {
    const onSeek = (point: string, time: number) => dispatch(seek(point, time, true));
    // We only support clicks and keypress events for now.
    // The rendering logic has limited the button display

    if (!jumpToCodeAnnotation) {
      return;
    }

    dispatch(jumpToKnownEventListenerHit(onSeek, jumpToCodeAnnotation));
  };

  const showBadge = testStep.data.name === "get";

  const isCurrent = position === "current";
  const shouldShowJumpToCode = (isHovered || isCurrent) && canShowJumpToCode;

  const jumpToCodeStatus: JumpToCodeStatus = !!jumpToCodeAnnotation ? "found" : "no_hits";

  return (
    <div
      className={styles.Row}
      data-status={error ? "error" : "success"}
      onClick={jumpToTestSourceDisabled ? undefined : onClickJumpToTestSource}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
      {shouldShowJumpToCode && annotations.start && (
        <div className={styles.JumpToCodeButton}>
          <JumpToCodeButton
            currentExecutionPoint={executionPoint}
            onClick={onJumpToClickEvent}
            status={jumpToCodeStatus}
            targetExecutionPoint={annotations.start.point}
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
