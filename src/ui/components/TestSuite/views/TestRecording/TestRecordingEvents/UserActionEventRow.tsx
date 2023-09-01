import assert from "assert";
import { TimeStampedPoint } from "@replayio/protocol";
import { Suspense, memo, useContext, useMemo, useState } from "react";
import { STATUS_PENDING, STATUS_RESOLVED, useImperativeCacheValue } from "suspense";

import { getExecutionPoint } from "devtools/client/debugger/src/selectors";
import Loader from "replay-next/components/Loader";
import { isExecutionPointsWithinRange } from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  GroupedTestCases,
  RecordingTestMetadataV3,
  TestSectionName,
  UserActionEvent,
  isUserActionTestEvent,
} from "shared/test-suites/RecordingTestMetadata";
import { jumpToKnownEventListenerHit } from "ui/actions/eventListeners/jumpToCode";
import { seek } from "ui/actions/timeline";
import { JumpToCodeButton, JumpToCodeStatus } from "ui/components/shared/JumpToCodeButton";
import { useJumpToSource } from "ui/components/TestSuite/hooks/useJumpToSource";
import { TestEventDetailsCache } from "ui/components/TestSuite/suspense/TestEventDetailsCache";
import { TestSuiteContext } from "ui/components/TestSuite/views/TestSuiteContext";
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
  check: "mousedown",
  uncheck: "mousedown",
  type: "keypress",
} as const;

export default memo(function UserActionEventRow({
  groupedTestCases,
  isSelected,
  testSectionName,
  userActionEvent,
}: {
  groupedTestCases: RecordingTestMetadataV3.GroupedTestCases;
  isSelected: boolean;
  testSectionName: TestSectionName;
  userActionEvent: UserActionEvent;
}) {
  const { data, timeStampedPointRange } = userActionEvent;
  const { command, error, parentId, timeStampedPoints, resultVariable } = data;
  const { result: resultTimeStampedPoint } = timeStampedPoints;

  const replayClient = useContext(ReplayClientContext);

  const { testRecording } = useContext(TestSuiteContext);
  assert(testRecording != null);

  const dispatch = useAppDispatch();
  const executionPoint = useAppSelector(getExecutionPoint);
  const viewMode = useAppSelector(getViewMode);
  const { status: annotationsStatus, value: parsedAnnotations } = useImperativeCacheValue(
    eventListenersJumpLocationsCache,
    replayClient
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
    annotationsStatus === STATUS_RESOLVED ? parsedAnnotations : NO_ANNOTATIONS;

  const [canShowJumpToCode, jumpToCodeAnnotation] = findJumpToCodeDetailsIfAvailable(
    groupedTestCases,
    userActionEvent,
    jumpToCodeAnnotations
  );

  const onJumpToClickEvent = async () => {
    assert(jumpToCodeAnnotation != null);

    const onSeek = (executionPoint: string, time: number) =>
      dispatch(
        seek({
          executionPoint,
          openSource: true,
          time,
        })
      );

    dispatch(jumpToKnownEventListenerHit(onSeek, jumpToCodeAnnotation));
  };

  const showBadge =
    isSelected &&
    command.name === "get" &&
    resultVariable != null &&
    resultTimeStampedPoint !== null;
  const showJumpToCode = (isHovered || isSelected) && canShowJumpToCode;

  let jumpToCodeStatus: JumpToCodeStatus = "loading";
  if (annotationsStatus !== STATUS_PENDING) {
    jumpToCodeStatus = !!jumpToCodeAnnotation ? "found" : "no_hits";
  }

  const eventNumber = useMemo(() => {
    if (parentId !== null) {
      return null;
    }

    let eventNumber = 0;

    const events = testRecording.events[testSectionName];
    for (let index = 0; index < events.length; index++) {
      const event = events[index];
      if (isUserActionTestEvent(event)) {
        if (event.data.parentId === null) {
          eventNumber++;
        }

        if (event === userActionEvent) {
          return eventNumber;
        }
      }
    }

    return null;
  }, [parentId, testRecording, testSectionName, userActionEvent]);

  return (
    <div
      className={styles.Row}
      data-chained-event={parentId !== null || undefined}
      data-status={error ? "error" : "success"}
      onClick={jumpToTestSourceDisabled ? undefined : onClickJumpToTestSource}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.Text}>
        {eventNumber != null ? <span className={styles.Number}>{eventNumber}</span> : null}
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
            isSelected={isSelected}
            timeStampedPoint={resultTimeStampedPoint}
            variable={resultVariable}
          />
        </Suspense>
      )}
      {showJumpToCode && timeStampedPointRange !== null && (
        <div className={styles.JumpToCodeButton}>
          <JumpToCodeButton
            currentExecutionPoint={executionPoint}
            onClick={onJumpToClickEvent}
            status={jumpToCodeStatus}
            targetExecutionPoint={timeStampedPointRange.begin.point}
          />
        </div>
      )}
    </div>
  );
});

function Badge({
  isSelected,
  timeStampedPoint,
  variable,
}: {
  isSelected: boolean;
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

  return <div className={isSelected ? styles.SelectedBadge : styles.Badge}>{value?.count}</div>;
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

    if (timeStampedPointRange !== null) {
      // TODO This is very Cypress-specific.
      // Playwright steps have a `name` like `locator.click("blah")`.
      // We only care about click events and keyboard events. Keyboard events appear to be a "type" command,
      // as in "type this text into the input".
      canShowJumpToCode =
        category === "command" && ["click", "type", "check", "uncheck"].includes(name);

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
  }

  return [canShowJumpToCode, jumpToCodeAnnotation] as const;
}
