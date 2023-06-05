import assert from "assert";
import { TimeStampedPoint } from "@replayio/protocol";
import { Suspense, memo, useContext, useMemo, useState } from "react";
import { useImperativeCacheValue } from "suspense";

import { getExecutionPoint } from "devtools/client/debugger/src/selectors";
import Loader from "replay-next/components/Loader";
import { isExecutionPointsWithinRange } from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  GroupedTestCases,
  TestSectionName,
  UserActionEvent,
  isUserActionEvent,
} from "shared/test-suites/types";
import { jumpToKnownEventListenerHit } from "ui/actions/eventListeners/jumpToCode";
import { seek } from "ui/actions/timeline";
import { JumpToCodeButton, JumpToCodeStatus } from "ui/components/shared/JumpToCodeButton";
import { useJumpToSource } from "ui/components/TestSuite/hooks/useJumpToSource";
import { TestEventDetailsCache } from "ui/components/TestSuite/suspense/TestEventDetailsCache";
import { Position } from "ui/components/TestSuite/views/TestRecording/types";
import { TestSuiteContext } from "ui/components/TestSuite/views/TetSuiteContext";
import { getViewMode } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import {
  ParsedJumpToCodeAnnotation,
  eventListenersJumpLocationsCache,
} from "ui/suspense/annotationsCaches";

import styles from "./UserActionEventRow.module.css";

const NO_ANNOTATIONS: ParsedJumpToCodeAnnotation[] = [];

const cypressStepTypesToEventTypes = {
  click: "mousedown",
  type: "keypress",
} as const;

export default memo(function UserActionEventRow({
  position,
  testSectionName,
  userActionEvent,
}: {
  position: Position;
  testSectionName: TestSectionName;
  userActionEvent: UserActionEvent;
}) {
  const { command, error } = userActionEvent.data;

  const { groupedTestCases, testRecording } = useContext(TestSuiteContext);
  assert(groupedTestCases != null);
  assert(testRecording != null);

  const dispatch = useAppDispatch();
  const executionPoint = useAppSelector(getExecutionPoint);
  const viewMode = useAppSelector(getViewMode);
  const { status: annotationsStatus, value: parsedAnnotations } = useImperativeCacheValue(
    eventListenersJumpLocationsCache
  );

  const [isHovered, setIsHovered] = useState(false);

  const argsString = useMemo(() => {
    if (command.arguments) {
      return command.arguments.filter(argument => typeof argument === "string").join(" ");
    }
    return "";
  }, [command.arguments]);

  const { disabled: jumpToTestSourceDisabled, onClick: onClickJumpToTestSource } = useJumpToSource({
    groupedTestCases,
    testEvent: userActionEvent,
    testRecording,
    openSourceAutomatically: viewMode === "dev",
  });

  const jumpToCodeAnnotations: ParsedJumpToCodeAnnotation[] =
    annotationsStatus === "resolved" ? parsedAnnotations : NO_ANNOTATIONS;

  const [canShowJumpToCode, jumpToCodeAnnotation] = findJumpToCodeDetailsIfAvailable(
    groupedTestCases,
    userActionEvent,
    jumpToCodeAnnotations
  );

  const onJumpToClickEvent = async () => {
    assert(jumpToCodeAnnotation != null);

    const onSeek = (point: string, time: number) => dispatch(seek(point, time, true));

    dispatch(jumpToKnownEventListenerHit(onSeek, jumpToCodeAnnotation));
  };

  const showBadge = command.name === "get" && userActionEvent.data.result != null;

  const isCurrent = position === "current";
  const shouldShowJumpToCode = (isHovered || isCurrent) && canShowJumpToCode;

  const jumpToCodeStatus: JumpToCodeStatus = !!jumpToCodeAnnotation ? "found" : "no_hits";

  const index = useMemo(() => {
    return testRecording.events[testSectionName].filter(isUserActionEvent).indexOf(userActionEvent);
  }, [testRecording, testSectionName, userActionEvent]);

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
        <span
          className={`${styles.Name} ${styles.Name}`}
          data-name={command.name}
          title={command.name}
        >
          {command.name}
        </span>{" "}
        <span className={`${styles.Args} ${styles.Args}`} title={argsString}>
          {argsString}
        </span>
      </div>
      {showBadge && (
        <Suspense fallback={<Loader />}>
          <Badge
            position={position}
            timeStampedPoint={userActionEvent.data.result!.timeStampedPoint}
            variable={userActionEvent.data.result!.variable}
          />
        </Suspense>
      )}
      {shouldShowJumpToCode && (
        <div className={styles.JumpToCodeButton}>
          <JumpToCodeButton
            currentExecutionPoint={executionPoint}
            onClick={onJumpToClickEvent}
            status={jumpToCodeStatus}
            targetExecutionPoint={userActionEvent.timeStampedPointRange.begin.point}
          />
        </div>
      )}
    </div>
  );
});

function Badge({
  position,
  timeStampedPoint,
  variable,
}: {
  position: Position;
  timeStampedPoint: TimeStampedPoint;
  variable: string;
}) {
  const client = useContext(ReplayClientContext);

  const { value } = useImperativeCacheValue(
    TestEventDetailsCache,
    client,
    timeStampedPoint,
    variable
  );
  if (value?.count === null) {
    return null;
  }

  return (
    <div className={position === "current" ? styles.SelectedBadge : styles.Badge}>
      {value?.count}
    </div>
  );
}

function findJumpToCodeDetailsIfAvailable(
  groupedTestCases: GroupedTestCases,
  userActionEvent: UserActionEvent,
  jumpToCodeAnnotations: ParsedJumpToCodeAnnotation[]
) {
  let canShowJumpToCode = false;
  let jumpToCodeAnnotation: ParsedJumpToCodeAnnotation | undefined = undefined;

  if (groupedTestCases.environment.testRunner.name === "cypress") {
    const { data, timeStampedPointRange } = userActionEvent;
    const { category, command } = data;
    const { name } = command;

    // TODO This is very Cypress-specific. Playwright steps have a `name` like `locator.click("blah")`.
    // We only care about click events and keyboard events. Keyboard events appear to be a "type" command,
    // as in "type this text into the input".
    canShowJumpToCode = category === "command" && ["click", "type"].includes(name);

    if (canShowJumpToCode) {
      const eventKind =
        cypressStepTypesToEventTypes[name as keyof typeof cypressStepTypesToEventTypes];

      if (eventKind) {
        jumpToCodeAnnotation = jumpToCodeAnnotations.find(a =>
          isExecutionPointsWithinRange(
            a.point,
            timeStampedPointRange.begin.point,
            timeStampedPointRange.end.point
          )
        );
      }
    }
  }

  return [canShowJumpToCode, jumpToCodeAnnotation] as const;
}
