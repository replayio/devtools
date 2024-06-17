import { useContext } from "react";
import { isPromiseLike } from "suspense";

import { selectLocation } from "devtools/client/debugger/src/actions/sources";
import { getContext } from "devtools/client/debugger/src/selectors";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  GroupedTestCases,
  TestEvent,
  TestRecording,
  isUserActionTestEvent,
} from "shared/test-suites/RecordingTestMetadata";
import { setViewMode } from "ui/actions/layout";
import { TestStepSourceLocationCache } from "ui/components/TestSuite/suspense/TestStepSourceLocationCache";
import { setSourcesUserActionPending } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { AwaitTimeout, awaitWithTimeout } from "ui/utils/awaitWithTimeout";

export function useJumpToSource({
  groupedTestCases,
  testEvent,
  testEvents,
  testRecording,
  openSourceAutomatically = false,
}: {
  groupedTestCases: GroupedTestCases;
  testEvent: TestEvent;
  testEvents: TestEvent[];
  testRecording: TestRecording;
  openSourceAutomatically: boolean;
}) {
  const replayClient = useContext(ReplayClientContext);

  const dispatch = useAppDispatch();
  const context = useAppSelector(getContext);

  let disabled = true;
  let name: string | undefined = undefined;
  if (testEvent.type === "user-action") {
    const { testRunner } = groupedTestCases.environment;

    name = testEvent.data.command.name;

    const cypressVersion = testRunner.name === "cypress" ? testRunner.version : undefined;

    disabled = !cypressVersion;
  }

  const onClick = async () => {
    if (openSourceAutomatically) {
      dispatch(setViewMode("dev"));
    }

    if (testRecording && isUserActionTestEvent(testEvent)) {
      if (testEvent.data.timeStampedPoints.viewSource === null) {
        return;
      }

      const locationPromise = TestStepSourceLocationCache.readAsync(
        replayClient,
        groupedTestCases,
        testEvent,
        testEvents
      );

      let location;
      if (isPromiseLike(locationPromise)) {
        let awaitedLocation = await awaitWithTimeout(locationPromise, 3000);
        if (awaitedLocation === AwaitTimeout) {
          dispatch(setSourcesUserActionPending(true));
          location = await locationPromise;
        } else {
          location = awaitedLocation;
        }
      } else {
        location = locationPromise;
      }

      if (location) {
        dispatch(selectLocation(context, location, openSourceAutomatically));
      }
    }

    dispatch(setSourcesUserActionPending(false));
  };

  return { disabled, onClick };
}
