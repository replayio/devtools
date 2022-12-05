import { Object, createPauseResult } from "@replayio/protocol";
import React, { useContext, useEffect, useState } from "react";

import { highlightNodes, unhighlightNode } from "devtools/client/inspector/markup/actions/markup";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { seek, setTimelineToPauseTime, setTimelineToTime } from "ui/actions/timeline";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getSelectedStep, setSelectedStep } from "ui/reducers/reporter";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { AnnotatedTestStep } from "ui/types";

import { ProgressBar } from "./ProgressBar";
import { TestCaseContext } from "./TestCase";
import { TestInfoContext } from "./TestInfo";
import { TestInfoContextMenuContext } from "./TestInfoContextMenuContext";

export function returnFirst<T, R>(
  list: T[] | undefined,
  fn: (value: T, index: number, list: T[]) => R | null
) {
  return list ? list.reduce<R | null>((acc, v, i, l) => acc ?? fn(v, i, l), null) : null;
}

export interface TestStepItemProps {
  step: AnnotatedTestStep;
  argString: string;
  index: number;
  id: string | null;
}

export function TestStepItem({ step, argString, index, id }: TestStepItemProps) {
  const [localPauseData, setLocalPauseData] = useState<{
    startPauseId?: string;
    endPauseId?: string;
    consoleProps?: Object;
  }>();
  const { setConsoleProps, setPauseId } = useContext(TestInfoContext);
  const [subjectNodePauseData, setSubjectNodePauseData] = useState<{
    pauseId: string;
    nodeIds: string[];
  }>();
  const currentTime = useAppSelector(getCurrentTime);
  const selectedStep = useAppSelector(getSelectedStep);
  const dispatch = useAppDispatch();
  const client = useContext(ReplayClientContext);
  const isPast = currentTime > step.absoluteStartTime;
  const isPaused = currentTime >= step.absoluteStartTime && currentTime < step.absoluteEndTime;
  const { point: pointEnd, message: messageEnd } = step.annotations.end || {};
  const { point: pointStart } = step.annotations.start || {};

  useEffect(() => {
    let endPauseResult: createPauseResult | undefined;
    let startPauseResult: createPauseResult | undefined;

    (async () => {
      try {
        let consoleProps: Object | undefined;

        endPauseResult = pointEnd ? await client.createPause(pointEnd) : undefined;
        startPauseResult = pointStart ? await client.createPause(pointStart) : undefined;
        const frames = endPauseResult?.data.frames;

        if (endPauseResult && frames) {
          const callerFrame = frames[1];

          if (messageEnd?.commandVariable) {
            const cmdResult = await client.evaluateExpression(
              endPauseResult.pauseId,
              `${messageEnd.commandVariable}.get("subject")`,
              callerFrame.frameId
            );

            const cmdObject = cmdResult.data.objects?.find(
              o => o.objectId === cmdResult.returned?.object
            );
            const length: number | undefined = cmdObject?.preview?.properties?.find(
              o => o.name === "length"
            )?.value;
            const subjects = Array.from({ length: length || 0 }, (_, i) =>
              cmdResult.data.objects?.find(
                obj =>
                  obj.objectId ===
                  cmdObject?.preview?.properties?.find(p => p.name === String(i))?.object
              )
            );

            const nodeIds = subjects.filter(s => s?.preview?.node).map(s => s?.objectId!);
            setSubjectNodePauseData({ pauseId: endPauseResult.pauseId, nodeIds });
          }

          if (messageEnd?.logVariable) {
            const logResult = await client.evaluateExpression(
              endPauseResult.pauseId,
              messageEnd.logVariable,
              callerFrame.frameId
            );

            const consolePropsProperty = returnFirst(logResult.data.objects, o => {
              return logResult.returned && o.objectId === logResult.returned.object
                ? returnFirst(o.preview?.properties, p => (p.name === "consoleProps" ? p : null))
                : null;
            });

            if (consolePropsProperty?.object) {
              const consolePropsPauseData = await client.getObjectWithPreview(
                consolePropsProperty.object,
                endPauseResult.pauseId
              );
              const consoleProps = consolePropsPauseData.objects?.find(
                o => o.objectId === consolePropsProperty.object
              );

              if (consoleProps?.preview) {
                // suppress the prototype entry in the properties output
                consoleProps.preview.prototypeId = undefined;
              }
            }
          }

          setLocalPauseData({
            startPauseId: startPauseResult?.pauseId,
            endPauseId: endPauseResult.pauseId,
            consoleProps,
          });
        }
      } catch {
        setLocalPauseData(undefined);
      }

      return null;
    })();

    // return async () => {
    //   if (endPauseResult) {
    //     await client.releasePause(endPauseResult.pauseId);
    //   }
    //   if (startPauseResult) {
    //     await client.releasePause(startPauseResult.pauseId);
    //   }
    // }
  }, [client, messageEnd, pointEnd, pointStart]);

  const onClick = () => {
    if (id && pointStart) {
      if (localPauseData?.endPauseId && localPauseData.consoleProps) {
        setConsoleProps(localPauseData.consoleProps);
        setPauseId(localPauseData.endPauseId);
      }
      dispatch(seek(pointStart!, step.absoluteStartTime, false, localPauseData?.startPauseId));
      dispatch(
        setSelectedStep({
          id,
          startTime: step.absoluteStartTime,
          endTime: step.absoluteEndTime - 1,
        })
      );
    }
  };
  const onMouseEnter = () => {
    dispatch(setTimelineToTime(step.absoluteStartTime));
    if (localPauseData?.startPauseId) {
      dispatch(setTimelineToPauseTime(localPauseData.startPauseId, step.absoluteStartTime));
    }
    if (subjectNodePauseData) {
      dispatch(highlightNodes(subjectNodePauseData.nodeIds, subjectNodePauseData.pauseId));
    }
  };
  const onMouseLeave = () => {
    dispatch(setTimelineToTime(currentTime));
    dispatch(unhighlightNode());
  };

  // This math is bananas don't look here until this is cleaned up :)
  const bump = isPaused || isPast ? 10 : 0;
  const actualProgress = bump + 90 * ((currentTime - step.absoluteStartTime) / step.duration);
  const progress = actualProgress > 100 ? 100 : actualProgress;
  const displayedProgress = step.duration === 1 && isPaused ? 100 : progress == 100 ? 0 : progress;

  const color = step.error ? "border-l-red-500" : "border-l-primaryAccent";

  return (
    <div
      className={`group/step relative flex items-start gap-1 border-b border-l-2 border-themeBase-90 pl-1 pr-3 font-mono hover:bg-toolbarBackground ${
        isPaused || isPast ? color : "border-l-transparent"
      } ${
        progress > 0 && step.error
          ? "bg-testsuitesErrorBgcolor text-testsuitesErrorColor hover:bg-testsuitesErrorBgcolorHover"
          : isPaused
          ? "bg-toolbarBackground"
          : "bg-testsuitesStepsBgcolor"
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button onClick={onClick} className="flex flex-grow items-start space-x-2  py-2 text-start">
        <div title={"" + displayedProgress} className="flex h-4 items-center">
          <ProgressBar progress={displayedProgress} error={!!step.error} />
        </div>
        <div className="opacity-70">{index + 1}</div>
        <div className={` font-medium ${isPaused ? "font-bold" : ""}`}>
          {step.parentId ? "- " : ""}
          {step.name} <span className="opacity-70">{argString}</span>
        </div>
      </button>
      <Actions step={step} isSelected={selectedStep?.id === id} />
    </div>
  );
}

function Actions({ step, isSelected }: { step: AnnotatedTestStep; isSelected: boolean }) {
  const { test } = useContext(TestCaseContext);
  const { show } = useContext(TestInfoContextMenuContext);

  const onClick = (e: React.MouseEvent) => {
    show({ x: e.pageX, y: e.pageY }, test, step);
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
