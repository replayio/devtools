import { Object as ProtocolObject } from "@replayio/protocol";
import cloneDeep from "lodash/cloneDeep";
import React, { useContext, useState } from "react";

import PropertiesRenderer from "bvaughn-architecture-demo/components/inspector/PropertiesRenderer";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { seek, setTimelineToTime } from "ui/actions/timeline";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getSelectedStep, setSelectedStep } from "ui/reducers/reporter";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { ProgressBar } from "./ProgressBar";
import { TestCaseContext } from "./TestCase";
import { TestInfoContext } from "./TestInfo";
import { TestInfoContextMenuContext } from "./TestInfoContextMenuContext";
import { TestStepContext } from "./TestStepRoot";

export function returnFirst<T, R>(
  list: T[] | undefined,
  fn: (value: T, index: number, list: T[]) => R | null
) {
  return list ? list.reduce<R | null>((acc, v, i, l) => acc ?? fn(v, i, l), null) : null;
}

export interface TestStepItemProps {
  argString: string;
  index: number;
  id: string | null;
}

export function TestStepItem({ argString, index, id }: TestStepItemProps) {
  const [localPauseData, setLocalPauseData] = useState<{ pauseId: string; consoleProps: any }>();
  const { setConsoleProps, setPauseId } = useContext(TestInfoContext);
  const [subjectNodePauseData, setSubjectNodePauseData] = useState<{
    pauseId: string;
    nodeIds: string[];
  }>();

  return null;
}

function Actions({ isSelected }: { isSelected: boolean }) {
  const { startTime: stepStartTime, duration, point } = useContext(TestStepContext);
  const { startTime: caseStartTime, endTime: caseEndTime } = useContext(TestCaseContext);
  const { show } = useContext(TestInfoContextMenuContext);

  const onClick = (e: React.MouseEvent) => {
    const testStep = {
      startTime: stepStartTime,
      endTime: stepStartTime + duration,
      enqueuePoint: point,
    };
    const testCase = {
      startTime: caseStartTime,
      endTime: caseEndTime,
    };
    show({ x: e.pageX, y: e.pageY }, testCase, testStep);
  };

  return (
    <button
      onClick={onClick}
      className={`${isSelected ? "" : "invisible"} py-2 group-hover/step:visible`}
    >
      <div className="flex items-center">
        <MaterialIcon>more_vert</MaterialIcon>
      </div>
    </button>
  );
}
