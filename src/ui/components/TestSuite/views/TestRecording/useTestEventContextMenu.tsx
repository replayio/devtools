import { useContext } from "react";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import { assert } from "protocol/utils";
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
import { TestSuiteContext } from "ui/components/TestSuite/views/TestSuiteContext";
import { useAppDispatch } from "ui/setup/hooks";

export function useTestEventContextMenu(testEvent: TestEvent) {
  const { contextMenu, onContextMenu } = useContextMenu(
    <>
      {isUserActionTestEvent(testEvent) && <JumpToSourceMenuItem userActionEvent={testEvent} />}
      <PlayToHereMenuItem testEvent={testEvent} />
      <PlayFromHereMenuItem testEvent={testEvent} />
      {isUserActionTestEvent(testEvent) && <ShowBeforeMenuItem userActionEvent={testEvent} />}
      {isUserActionTestEvent(testEvent) && <ShowAfterMenuItem userActionEvent={testEvent} />}
    </>
  );

  return { contextMenu, onContextMenu };
}

function JumpToSourceMenuItem({ userActionEvent }: { userActionEvent: UserActionEvent }) {
  const { groupedTestCases, setTestEvent, testRecording } = useContext(TestSuiteContext);
  assert(groupedTestCases != null);
  assert(testRecording != null);

  const { disabled, onClick } = useJumpToSource({
    groupedTestCases,
    testEvent: userActionEvent,
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

  const playFromHere = () => {
    setTestEvent(testEvent);

    dispatch(
      startPlayback({
        beginPoint: getTestEventExecutionPoint(testEvent),
        beginTime: getTestEventTime(testEvent),
        endPoint: testRecording.timeStampedPointRange.end.point,
        endTime: testRecording.timeStampedPointRange.end.time,
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

  const playToHere = async () => {
    setTestEvent(testEvent);

    dispatch(
      startPlayback({
        beginPoint: testRecording.timeStampedPointRange.begin.point,
        beginTime: testRecording.timeStampedPointRange.begin.time,
        endPoint: getTestEventExecutionPoint(testEvent),
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
