import React, { createContext, useContext, useEffect, useState } from "react";

import { highlightNodes, unhighlightNode } from "devtools/client/inspector/markup/actions/markup";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { seekToTime, setTimelineToTime } from "ui/actions/timeline";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getSelectedStep, setSelectedStep } from "ui/reducers/reporter";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { ProgressBar } from "./ProgressBar";
import { TestCaseContext } from "./TestCase";
import { TestInfoContext } from "./TestInfo";
import { TestInfoContextMenuContext } from "./TestInfoContextMenuContext";
import { TestStepContext } from "./TestStepRoot";

function returnFirst<T, R>(list: T[] | undefined, fn: (v: T) => R | null) {
  return list ? list.reduce<R | null>((acc, v) => acc ?? fn(v), null) : null;
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
  const currentTime = useAppSelector(getCurrentTime);
  const selectedStep = useAppSelector(getSelectedStep);
  const dispatch = useAppDispatch();
  const client = useContext(ReplayClientContext);
  const { startTime, duration, messageEnd, pointEnd, error, stepName, parentId } =
    useContext(TestStepContext);
  const isPast = currentTime > startTime;
  const isPaused = currentTime >= startTime && currentTime < startTime + duration;

  useEffect(() => {
    (async () => {
      if (!pointEnd) {
        return null;
      }

      try {
        const pauseResult = await client.createPause(pointEnd);
        const frames = pauseResult.data.frames;

        if (!frames) {
          return null;
        }

        const callerFrame = frames[1];

        if (messageEnd?.commandVariable) {
          const cmdResult = await client.evaluateExpression(
            pauseResult.pauseId,
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
          setSubjectNodePauseData({ pauseId: pauseResult.pauseId, nodeIds });
        }

        if (messageEnd?.logVariable) {
          const logResult = await client.evaluateExpression(
            pauseResult.pauseId,
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
              pauseResult.pauseId
            );
            const consoleProps = consolePropsPauseData.objects?.find(
              o => o.objectId === consolePropsProperty.object
            );

            if (consoleProps?.preview) {
              // suppress the prototype entry in the properties output
              consoleProps.preview.prototypeId = undefined;
            }

            setLocalPauseData({ pauseId: pauseResult.pauseId, consoleProps });
          }
        }
      } catch {
        setLocalPauseData(undefined);
      }

      return null;
    })();
  }, [client, messageEnd, pointEnd, setConsoleProps, setPauseId]);

  const onClick = () => {
    if (id) {
      if (localPauseData) {
        setConsoleProps(localPauseData.consoleProps);
        setPauseId(localPauseData.pauseId);
      }
      dispatch(seekToTime(startTime));
      dispatch(setSelectedStep({ id, startTime, endTime: startTime + duration - 1 }));
    }
  };
  const onMouseEnter = () => {
    dispatch(setTimelineToTime(startTime));
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
  const actualProgress = bump + 90 * ((currentTime - startTime) / duration);
  const progress = actualProgress > 100 ? 100 : actualProgress;
  const displayedProgress = duration === 1 && isPaused ? 100 : progress;

  const color = error ? "border-l-red-500" : "border-l-primaryAccent";

  return (
    <div
      className={`group/step relative flex items-start gap-1 border-b border-l-2 border-themeBase-90 pl-1 pr-3 font-mono hover:bg-toolbarBackground ${
        isPaused || isPast ? color : "border-l-transparent"
      } ${
        progress > 0 && error
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
          <ProgressBar progress={displayedProgress} error={error} />
        </div>
        <div className="opacity-70">{index + 1}</div>
        <div className={` font-medium ${isPaused ? "font-bold" : ""}`}>
          {parentId ? "- " : ""}
          {stepName} <span className="opacity-70">{argString}</span>
        </div>
      </button>
      <Actions isSelected={selectedStep?.id === id} />
    </div>
  );
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
