import { useCallback, useContext } from "react";

import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { imperativelyGetClosestPointForTime } from "replay-next/src/suspense/ExecutionPointsCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ProcessedTestItem } from "ui/components/TestSuite/types";
import { getSelectedTestItem } from "ui/reducers/reporter";
import { selectTestItem as selectTestItemAction } from "ui/reducers/reporter";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import TestItemPanel from "./TestItem";
import TestMetadataPanel from "./TestMetadata";
import styles from "./TestSuitePanel.module.css";

export default function TestSuitePanel() {
  const { updateForTimelineImprecise: zoom } = useContext(FocusContext);
  const replayClient = useContext(ReplayClientContext);
  const { update: seekToTime } = useContext(TimelineContext);

  const dispatch = useAppDispatch();
  const selectedTestItem = useAppSelector(getSelectedTestItem);

  // Select a test item and update the current focus region and time
  const selectTestItem = useCallback(
    async (testItem: ProcessedTestItem | null) => {
      dispatch(selectTestItemAction(testItem));

      if (testItem != null) {
        const { duration, relativeStartTime } = testItem;

        await zoom([relativeStartTime, relativeStartTime + duration], {
          bias: "begin",
          debounce: false,
          sync: true,
        });

        const executionPoint = await imperativelyGetClosestPointForTime(
          replayClient,
          relativeStartTime
        );
        seekToTime(relativeStartTime, executionPoint, false);
      }
    },
    [dispatch, replayClient, seekToTime, zoom]
  );

  if (selectedTestItem === null) {
    return (
      <div className={styles.Panel}>
        <TestMetadataPanel selectTestItem={selectTestItem} />
      </div>
    );
  } else {
    return (
      <div className={styles.Panel}>
        <TestItemPanel
          clearSelectedTestItem={() => selectTestItem(null)}
          testItem={selectedTestItem}
        />
      </div>
    );
  }
}
