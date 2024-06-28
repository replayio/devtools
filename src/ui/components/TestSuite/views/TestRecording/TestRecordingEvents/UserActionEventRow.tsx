import assert from "assert";
import { ExecutionPoint, Location, TimeStampedPoint } from "@replayio/protocol";
import { Suspense, memo, useContext, useMemo, useState } from "react";
import { Cache, STATUS_PENDING, STATUS_RESOLVED, useImperativeCacheValue } from "suspense";

import { getExecutionPoint } from "devtools/client/debugger/src/selectors";
import Loader from "replay-next/components/Loader";
import { isExecutionPointsWithinRange } from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  GroupedTestCases,
  RecordingTestMetadataV3,
  TestEvent,
  TestSectionName,
  UserActionEvent,
  isUserActionTestEvent,
  isUserClickEvent,
  isUserKeyboardEvent,
} from "shared/test-suites/RecordingTestMetadata";
import { jumpToKnownEventListenerHit } from "ui/actions/eventListeners/jumpToCode";
import { seek } from "ui/actions/timeline";
import { JumpToCodeButton, JumpToCodeStatus } from "ui/components/shared/JumpToCodeButton";
import { useJumpToSource } from "ui/components/TestSuite/hooks/useJumpToSource";
import {
  TestEventDetailsEntry,
  testEventDetailsResultsCache,
} from "ui/components/TestSuite/suspense/TestEventDetailsCache";
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
  testEvents,
  testSectionName,
  userActionEvent,
}: {
  groupedTestCases: RecordingTestMetadataV3.GroupedTestCases;
  isSelected: boolean;
  testEvents: TestEvent[];
  testSectionName: TestSectionName;
  userActionEvent: UserActionEvent;
}) {
  const { data } = userActionEvent;
  const { command, error, parentId, timeStampedPoints } = data;

  const resultPoint = timeStampedPoints.result;

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
    testEvents,
    testRecording,
    openSourceAutomatically: viewMode === "dev",
  });

  const jumpToCodeAnnotations: ParsedJumpToCodeAnnotation[] =
    annotationsStatus === STATUS_RESOLVED ? parsedAnnotations : NO_ANNOTATIONS;

  const [canShowJumpToCode, jumpToCodeAnnotation] = findJumpToCodeDetailsIfAvailable(
    userActionEvent,
    jumpToCodeAnnotations
  );

  const onJumpToClickEvent = async () => {
    assert(jumpToCodeAnnotation != null);

    const onSeek = (executionPoint: string, time: number, location: Location) =>
      dispatch(
        seek({
          executionPoint,
          openSource: true,
          time,
          location,
        })
      );

    dispatch(jumpToKnownEventListenerHit(onSeek, jumpToCodeAnnotation));
  };

  const showBadge = isSelected && resultPoint !== null;
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
          return eventNumber < 10 ? `0${eventNumber}` : eventNumber;
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
        {eventNumber != null ? <div className={styles.Number}>{eventNumber}</div> : null}
        <div className={styles.Event}>
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
      </div>
      {showBadge && (
        <Suspense fallback={<Loader />}>
          <Badge isSelected={isSelected} timeStampedPoint={resultPoint} />
        </Suspense>
      )}
      {showJumpToCode && jumpToCodeAnnotation && (
        <div className={styles.JumpToCodeButton}>
          <JumpToCodeButton
            currentExecutionPoint={executionPoint}
            onClick={onJumpToClickEvent}
            status={jumpToCodeStatus}
            targetExecutionPoint={jumpToCodeAnnotation.point}
          />
        </div>
      )}
    </div>
  );
});

function Badge({
  isSelected,
  timeStampedPoint,
}: {
  isSelected: boolean;
  timeStampedPoint: TimeStampedPoint;
}) {
  const client = useContext(ReplayClientContext);

  const { status, value } = useImperativeCacheValue(
    testEventDetailsResultsCache as unknown as Cache<
      [executionPoint: ExecutionPoint],
      TestEventDetailsEntry
    >,
    timeStampedPoint.point
  );

  if (value?.count === null) {
    return null;
  }

  return <div className={isSelected ? styles.SelectedBadge : styles.Badge}>{value?.count}</div>;
}

function findJumpToCodeDetailsIfAvailable(
  userActionEvent: UserActionEvent,
  jumpToCodeAnnotations: ParsedJumpToCodeAnnotation[]
) {
  let canShowJumpToCode = false;
  let jumpToCodeAnnotation: ParsedJumpToCodeAnnotation | undefined = undefined;

  const { data } = userActionEvent;
  const { timeStampedPoints } = data;

  if (timeStampedPoints.beforeStep !== null && timeStampedPoints.afterStep !== null) {
    canShowJumpToCode = isUserClickEvent(userActionEvent) || isUserKeyboardEvent(userActionEvent);
    jumpToCodeAnnotation = jumpToCodeAnnotations.find(a =>
      isExecutionPointsWithinRange(
        a.point,
        timeStampedPoints.beforeStep!.point,
        timeStampedPoints.afterStep!.point
      )
    );
  }

  return [canShowJumpToCode, jumpToCodeAnnotation] as const;
}
