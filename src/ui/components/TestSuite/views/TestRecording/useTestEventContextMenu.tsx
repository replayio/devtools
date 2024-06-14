import { useContext } from "react";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import { assert } from "protocol/utils";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  TestEvent,
  UserActionEvent,
  getTestEventExecutionPoint,
  getTestEventTime,
  isUserActionTestEvent,
} from "shared/test-suites/RecordingTestMetadata";
import { startPlayback } from "ui/actions/timeline";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useJumpToSource } from "ui/components/TestSuite/hooks/useJumpToSource";
import { useShowUserActionEventBoundary } from "ui/components/TestSuite/hooks/useShowUserActionEventBoundary";
import { TestSuiteCache } from "ui/components/TestSuite/suspense/TestSuiteCache";
import { TestSuiteContext } from "ui/components/TestSuite/views/TestSuiteContext";
import { useAppDispatch } from "ui/setup/hooks";

export function useTestEventContextMenu(testEvent: TestEvent, testEvents: TestEvent[]) {
  const { contextMenu, onContextMenu } = useContextMenu(
    <>
      {isUserActionTestEvent(testEvent) && (
        <JumpToSourceMenuItem testEvents={testEvents} userActionEvent={testEvent} />
      )}
      <PlayToHereMenuItem testEvent={testEvent} />
      <PlayFromHereMenuItem testEvent={testEvent} />
      {isUserActionTestEvent(testEvent) && <ShowBeforeMenuItem userActionEvent={testEvent} />}
      {isUserActionTestEvent(testEvent) && <ShowAfterMenuItem userActionEvent={testEvent} />}
    </>
  );

  return { contextMenu, onContextMenu };
}

function JumpToSourceMenuItem({
  testEvents,
  userActionEvent,
}: {
  testEvents: TestEvent[];
  userActionEvent: UserActionEvent;
}) {
  const replayClient = useContext(ReplayClientContext);
  const { recordingId } = useContext(SessionContext);
  const { setTestEvent, testRecording } = useContext(TestSuiteContext);
  assert(testRecording != null);

  const groupedTestCases = TestSuiteCache.read(replayClient, recordingId);
  assert(groupedTestCases != null);

  const { disabled, onClick } = useJumpToSource({
    groupedTestCases,
    testEvent: userActionEvent,
    testEvents,
    testRecording,
    openSourceAutomatically: true,
  });

  const onSelect = () => {
    setTestEvent(userActionEvent);
    onClick();
  };

  return (
    <ContextMenuItem disabled={disabled} onSelect={onSelect}>
      <MaterialIcon>code</MaterialIcon>
      Jump to test source
    </ContextMenuItem>
  );
}

// Play from test step start time to test end time
function PlayFromHereMenuItem({ testEvent }: { testEvent: TestEvent }) {
  const { setTestEvent, testRecording } = useContext(TestSuiteContext);
  assert(testRecording != null);

  const dispatch = useAppDispatch();

  const endTimeStampedPoint = testRecording.timeStampedPointRange?.end ?? null;
  if (endTimeStampedPoint == null) {
    return null;
  }

  const playFromHere = () => {
    setTestEvent(testEvent);

    dispatch(
      startPlayback({
        beginTime: getTestEventTime(testEvent),
        endTime: endTimeStampedPoint.time,
      })
    );
  };

  return (
    <ContextMenuItem onSelect={playFromHere}>
      <MaterialIcon>play_circle</MaterialIcon>
      Play from here
    </ContextMenuItem>
  );
}

// Play from test start time to annotation end time
function PlayToHereMenuItem({ testEvent }: { testEvent: TestEvent }) {
  const { setTestEvent, testRecording } = useContext(TestSuiteContext);
  assert(testRecording != null);

  const dispatch = useAppDispatch();

  const beginTimeStampedPoint = testRecording.timeStampedPointRange?.begin ?? null;
  const endPoint = getTestEventExecutionPoint(testEvent);
  if (beginTimeStampedPoint == null || endPoint == null) {
    return null;
  }

  const playToHere = async () => {
    setTestEvent(testEvent);

    dispatch(
      startPlayback({
        beginTime: beginTimeStampedPoint.time,
        endTime: getTestEventTime(testEvent),
      })
    );
  };

  return (
    <ContextMenuItem onSelect={playToHere}>
      <MaterialIcon>play_circle</MaterialIcon>
      Play to here
    </ContextMenuItem>
  );
}

function ShowAfterMenuItem({ userActionEvent }: { userActionEvent: UserActionEvent }) {
  const { setTestEvent } = useContext(TestSuiteContext);

  const { disabled, onClick } = useShowUserActionEventBoundary({
    boundary: "after",
    userActionEvent,
  });

  const onSelect = () => {
    setTestEvent(userActionEvent);
    onClick();
  };

  return (
    <ContextMenuItem disabled={disabled} onSelect={onSelect}>
      <MaterialIcon>arrow_forward</MaterialIcon>
      Show after
    </ContextMenuItem>
  );
}

function ShowBeforeMenuItem({ userActionEvent }: { userActionEvent: UserActionEvent }) {
  const { setTestEvent } = useContext(TestSuiteContext);

  const { disabled, onClick } = useShowUserActionEventBoundary({
    boundary: "before",
    userActionEvent,
  });

  const onSelect = () => {
    setTestEvent(userActionEvent);
    onClick();
  };

  return (
    <ContextMenuItem disabled={disabled} onSelect={onSelect}>
      <MaterialIcon>arrow_back</MaterialIcon>
      Show before
    </ContextMenuItem>
  );
}
