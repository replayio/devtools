import { ExecutionPoint, TimeStampedPoint } from "@replayio/protocol";
import { useMemo } from "react";
import { Cache, STATUS_PENDING, useImperativeCacheValue } from "suspense";

import PropertiesRenderer from "replay-next/components/inspector/PropertiesRenderer";
import { InspectableTimestampedPointContext } from "replay-next/src/contexts/InspectorContext";
import { UserActionEvent } from "shared/test-suites/RecordingTestMetadata";
import {
  TestEventDetailsEntry,
  testEventDetailsResultsCache,
} from "ui/components/TestSuite/suspense/TestEventDetailsCache";

import { LoadingFailedMessage, LoadingInProgress } from "./TestEventLoadingMessages";
import styles from "./TestEventDetails.module.css";

export function CypressUserActionEventDetails({ testEvent }: { testEvent: UserActionEvent }) {
  // Parent ensures this exists
  const timeStampedPoint = testEvent.data.timeStampedPoints.result!;
  const { status, value } = useImperativeCacheValue(
    testEventDetailsResultsCache as unknown as Cache<
      [executionPoint: ExecutionPoint],
      TestEventDetailsEntry
    >,
    timeStampedPoint.point
  );

  const context = useMemo(
    () => ({
      executionPoint: timeStampedPoint.point,
      time: timeStampedPoint.time,
    }),
    [timeStampedPoint]
  );

  if (status === STATUS_PENDING) {
    return <LoadingInProgress />;
  } else if (value?.props == null || value?.pauseId == null) {
    return <LoadingFailedMessage />;
  }

  return (
    <div className={styles.UserActionEventDetails} data-test-name="UserActionEventDetails">
      <InspectableTimestampedPointContext.Provider value={context}>
        <PropertiesRenderer pauseId={value.pauseId} object={value.props} />
      </InspectableTimestampedPointContext.Provider>
    </div>
  );
}
