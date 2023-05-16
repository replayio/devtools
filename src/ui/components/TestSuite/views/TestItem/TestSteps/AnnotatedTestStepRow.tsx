import { Suspense, memo, useContext, useMemo, useState } from "react";

import { getExecutionPoint } from "devtools/client/debugger/src/selectors";
import Loader from "replay-next/components/Loader";
import useSuspendAfterMount from "replay-next/src/hooks/useSuspendAfterMount";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  PointWithEventType,
  jumpToClickEventFunctionLocation,
} from "ui/actions/eventListeners/jumpToCode";
import { seek } from "ui/actions/timeline";
import { JumpToCodeButton, JumpToCodeStatus } from "ui/components/shared/JumpToCodeButton";
import { useJumpToSource } from "ui/components/TestSuite/hooks/useJumpToSource";
import { getConsolePropsCountSuspense } from "ui/components/TestSuite/suspense/consoleProps";
import { AnnotatedTestStep, ProcessedTestMetadata } from "ui/components/TestSuite/types";
import { Position } from "ui/components/TestSuite/views/TestItem/types";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

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

  const isCurrent = position === "current";

  const dispatch = useAppDispatch();
  const executionPoint = useAppSelector(getExecutionPoint);
  const [jumpToCodeStatus, setJumpToCodeStatus] = useState<JumpToCodeStatus>("not_checked");

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

  const onJumpToClickEvent = async () => {
    const onSeek = (point: string, time: number) => dispatch(seek(point, time, true));
    // We only support clicks and keypress events for now.
    // The rendering logic has limited the button display

    const cypressStepTypesToEventTypes = {
      click: "mousedown",
      type: "keypress",
    } as const;
    const eventKind =
      cypressStepTypesToEventTypes[testStep.data.name as keyof typeof cypressStepTypesToEventTypes];

    const { start, end } = annotations;

    if (!eventKind || !start) {
      // Shouldn't happen - the rendering logic _should_ make sure the step matches
      return;
    }

    const eventPoint: PointWithEventType = { ...start, kind: eventKind };

    setJumpToCodeStatus("loading");
    const result = await dispatch(jumpToClickEventFunctionLocation(onSeek, eventPoint, end));
    setJumpToCodeStatus(result);

    if (result === "not_loaded") {
      // Clear this out after a few seconds since the user could change focus.
      // Simpler than trying to watch the focus region change over time.
      setTimeout(() => {
        setJumpToCodeStatus("not_checked");
      }, 5000);
    }
  };

  const showBadge = testStep.data.name === "get";

  // TODO This is very Cypress-specific. Playwright steps have a `name` like `locator.click("blah")`.
  // We only care about click events and keyboard events. Keyboard events appear to be a "type" command,
  // as in "type this text into the input".
  let shouldShowJumpToCode = false;
  if (isHovered || isCurrent) {
    if ("category" in testStep.data) {
      shouldShowJumpToCode =
        "category" in testStep.data &&
        testStep.data.category === "command" &&
        (testStep.data.name === "click" || testStep.data.name === "type");
    }
  }

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
