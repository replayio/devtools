import { ContextMenuItem, useContextMenu } from "use-context-menu";

import { assert } from "protocol/utils";
import Icon from "replay-next/components/Icon";
import { TestItem } from "shared/graphql/types";
import { startPlayback } from "ui/actions/timeline";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useJumpToSource } from "ui/components/TestSuite/hooks/useJumpToSource";
import { useShowTestStepBoundary } from "ui/components/TestSuite/hooks/useShowTestStepBoundary";
import { ProcessedTestMetadata, ProcessedTestStep } from "ui/components/TestSuite/types";
import { useAppDispatch } from "ui/setup/hooks";

import styles from "./DropDownMenu.module.css";

export default function DropDownMenu({
  testItem,
  testItemStartTime,
  testMetadata,
  testStep,
}: {
  testItem: TestItem;
  testItemStartTime: number;
  testMetadata: ProcessedTestMetadata;
  testStep: ProcessedTestStep;
}) {
  const { contextMenu, onContextMenu } = useContextMenu(
    <>
      <JumpToSourceMenuItem testMetadata={testMetadata} testStep={testStep} />
      <PlayToHereMenuItem testItemStartTime={testItemStartTime} testStep={testStep} />
      <PlayFromHereMenuItem
        testItem={testItem}
        testItemStartTime={testItemStartTime}
        testStep={testStep}
      />
      <ShowBeforeMenuItem testStep={testStep} />
      <ShowAfterMenuItem testStep={testStep} />
    </>
  );

  return (
    <>
      <button className={styles.DropDownButton} onClick={onContextMenu}>
        <Icon className={styles.Icon} type="dots" />
      </button>
      {contextMenu}
    </>
  );
}

function JumpToSourceMenuItem({
  testMetadata,
  testStep,
}: {
  testMetadata: ProcessedTestMetadata;
  testStep: ProcessedTestStep;
}) {
  const { disabled, onClick } = useJumpToSource({ testMetadata, testStep });

  return (
    <ContextMenuItem disabled={disabled} onSelect={onClick}>
      <MaterialIcon>code</MaterialIcon>
      Jump to source
    </ContextMenuItem>
  );
}

// Play from test step start time to test end time
function PlayFromHereMenuItem({
  testItem,
  testItemStartTime,
  testStep,
}: {
  testItem: TestItem;
  testItemStartTime: number;
  testStep: ProcessedTestStep;
}) {
  const dispatch = useAppDispatch();

  let beginTime: number | undefined = undefined;
  let endTime: number | undefined = undefined;
  if (testStep.type === "step") {
    const { data, metadata } = testStep;
    if (!metadata.isLast && data.absoluteStartTime != null && testItem.duration != null) {
      beginTime = data.absoluteStartTime;
      endTime = testItemStartTime + testItem.duration;
    }
  }

  const disabled = beginTime == null || endTime == null;

  const playFromHere = () => {
    assert(beginTime != null && endTime != null);

    dispatch(
      startPlayback({
        beginTime,
        endTime,
      })
    );
  };

  return (
    <ContextMenuItem disabled={disabled} onSelect={playFromHere}>
      <MaterialIcon>play_circle</MaterialIcon>
      Play from here
    </ContextMenuItem>
  );
}

// Play from test start time to annotation end time
function PlayToHereMenuItem({
  testItemStartTime,
  testStep,
}: {
  testItemStartTime: number;
  testStep: ProcessedTestStep;
}) {
  const dispatch = useAppDispatch();

  let disabled = true;
  if (testStep.type === "step" && !testStep.metadata.isFirst) {
    disabled = false;
  }

  const playToHere = async () => {
    assert(testStep.type === "step");

    const { data } = testStep;
    const { annotations } = data;

    const beginTime = testItemStartTime;
    const endTime = annotations.end?.time || data.absoluteEndTime;
    const endPoint = annotations.end?.point;

    dispatch(
      startPlayback({
        beginTime,
        endTime,
        endPoint,
      })
    );
  };

  return (
    <ContextMenuItem disabled={disabled} onSelect={playToHere}>
      <MaterialIcon>play_circle</MaterialIcon>
      Play to here
    </ContextMenuItem>
  );
}

function ShowAfterMenuItem({ testStep }: { testStep: ProcessedTestStep }) {
  const { disabled, onClick } = useShowTestStepBoundary({ boundary: "after", testStep });

  return (
    <ContextMenuItem disabled={disabled} onSelect={onClick}>
      <MaterialIcon>arrow_forward</MaterialIcon>
      Show after
    </ContextMenuItem>
  );
}

function ShowBeforeMenuItem({ testStep }: { testStep: ProcessedTestStep }) {
  const { disabled, onClick } = useShowTestStepBoundary({ boundary: "before", testStep });

  return (
    <ContextMenuItem disabled={disabled} onSelect={onClick}>
      <MaterialIcon>arrow_back</MaterialIcon>
      Show before
    </ContextMenuItem>
  );
}
