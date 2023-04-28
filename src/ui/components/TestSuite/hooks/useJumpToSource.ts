import { useContext } from "react";
import { isPromiseLike } from "suspense";

import { selectLocation } from "devtools/client/debugger/src/actions/sources";
import { getContext } from "devtools/client/debugger/src/selectors";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Annotations } from "shared/graphql/types";
import { setViewMode } from "ui/actions/layout";
import { seek } from "ui/actions/timeline";
import { TestStepSourceLocationCache } from "ui/components/TestSuite/suspense/TestStepSourceLocationCache";
import { ProcessedTestMetadata, ProcessedTestStep } from "ui/components/TestSuite/types";
import { setSourcesUserActionPending } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { AwaitTimeout, awaitWithTimeout } from "ui/utils/awaitWithTimeout";

export function useJumpToSource({
  testMetadata,
  testStep,
}: {
  testMetadata: ProcessedTestMetadata;
  testStep: ProcessedTestStep;
}) {
  const replayClient = useContext(ReplayClientContext);

  const dispatch = useAppDispatch();
  const context = useAppSelector(getContext);

  let annotations: Annotations | undefined = undefined;
  let disabled = true;
  let name: string | undefined = undefined;
  if (testStep.type === "step") {
    const { runner } = testMetadata;

    annotations = testStep.data.annotations;
    name = testStep.data.name;

    const cypressVersion = runner?.name === "cypress" ? runner?.version : undefined;
    const isChaiAssertion = name === "assert" && !annotations.enqueue;
    const annotation = isChaiAssertion ? annotations.start : annotations.enqueue;

    disabled = !cypressVersion || !annotation;
  }

  const onClick = async () => {
    dispatch(setViewMode("dev"));

    if (testMetadata && testStep.type === "step") {
      const locationPromise = TestStepSourceLocationCache.readAsync(
        replayClient,
        testMetadata,
        testStep
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
        dispatch(selectLocation(context, location));
      }

      if (testStep.metadata.range.beginPoint && testStep.metadata.range.beginTime) {
        dispatch(
          seek(testStep.metadata.range.beginPoint, testStep.metadata.range.beginTime, false)
        );
      }
    }

    dispatch(setSourcesUserActionPending(false));
  };

  return { disabled, onClick };
}
