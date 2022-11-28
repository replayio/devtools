import { Object as ProtocolObject } from "@replayio/protocol";
import cloneDeep from "lodash/cloneDeep";
import React, { useContext, useState } from "react";

import PropertiesRenderer from "bvaughn-architecture-demo/components/inspector/PropertiesRenderer";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { seekToTime, setTimelineToTime } from "ui/actions/timeline";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { CypressAnnotationMessage } from "ui/types";

import { selectLocation } from "../../actions/sources";
import { getThreadContext } from "../../selectors";
import { ProgressBar } from "./ProgressBar";
import { TestStepActions } from "./TestStepActions";

function returnFirst<T, R>(list: T[] | undefined, fn: (v: T) => R | null) {
  return list ? list.reduce<R | null>((acc, v) => acc ?? fn(v), null) : null;
}

export function TestStepItem({
  messageEnqueue,
  messageEnd,
  point,
  pointEnd,
  stepName,
  startTime,
  duration,
  argString,
  index,
  parentId,
  error,
  isLastStep,
  onReplay,
  onPlayFromHere,
  id,
  selectedIndex,
  setSelectedIndex,
}: {
  messageEnqueue?: CypressAnnotationMessage;
  messageEnd?: CypressAnnotationMessage;
  point?: string;
  pointEnd?: string;
  stepName: string;
  startTime: number;
  duration: number;
  argString: string;
  index: number;
  parentId?: string;
  error: boolean;
  isLastStep: boolean;
  onReplay: () => void;
  onPlayFromHere: () => void;
  selectedIndex: string | null;
  id: string | null;
  setSelectedIndex: (index: string | null) => void;
}) {
  const [consoleProps, setConsoleProps] = useState<ProtocolObject>();
  const [pauseId, setPauseId] = useState<string | null>(null);
  const cx = useAppSelector(getThreadContext);
  const currentTime = useAppSelector(getCurrentTime);
  const dispatch = useAppDispatch();
  const isPast = currentTime > startTime;
  const client = useContext(ReplayClientContext);
  // some chainers (`then`) don't have a duration, so let's bump it here (+1) so that it shows something in the UI
  const adjustedDuration = duration || 1;
  const isPaused = currentTime >= startTime && currentTime < startTime + adjustedDuration;
  const selected = selectedIndex === id;

  const getConsoleProps = async () => {
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

          const consolePropsCopy = cloneDeep(consoleProps);

          if (consolePropsCopy?.preview) {
            // suppress the prototype entry in the properties output
            consolePropsCopy.preview.prototypeId = undefined;
          }

          if (consolePropsCopy?.preview?.properties) {
            // Remove snapshot value
            consolePropsCopy.preview.properties = consolePropsCopy.preview.properties.filter(
              p => p.name !== "Snapshot"
            );
          }

          setPauseId(pauseResult.pauseId);
          setConsoleProps(consolePropsCopy);
        }
      }
    } catch {
      setPauseId(null);
      setConsoleProps(undefined);
    }

    return null;
  };
  const onClick = () => {
    dispatch(seekToTime(startTime));
    setSelectedIndex(id);

    getConsoleProps();
  };
  const onMouseEnter = () => dispatch(setTimelineToTime(startTime));
  const onMouseLeave = () => dispatch(setTimelineToTime(currentTime));
  const onJumpToBefore = () => dispatch(seekToTime(startTime));
  const onJumpToAfter = () => {
    dispatch(seekToTime(startTime + adjustedDuration - 1));
  };
  const onGoToLocation = async () => {
    if (!point) {
      return;
    }

    const frame = await (async point => {
      const {
        data: { frames },
      } = await client.createPause(point);

      const returnFirst = (list: any, fn: any) =>
        list.reduce((acc: any, v: any, i: any) => acc ?? fn(v, i, list), null);

      return returnFirst(frames, (f: any, i: any, l: any) =>
        l[i + 1]?.functionName === "__stackReplacementMarker" ? f : null
      );
    })(point);

    const location = frame.location[frame.location.length - 1];

    if (location) {
      dispatch(selectLocation(cx, location));
    }
  };

  // This math is bananas don't look here until this is cleaned up :)
  const bump = isPaused || isPast ? 10 : 0;
  const actualProgress = bump + 90 * ((currentTime - startTime) / adjustedDuration);
  const progress = actualProgress > 100 ? 100 : actualProgress;
  const displayedProgress = adjustedDuration === 1 && isPaused ? 100 : progress;

  const color = error ? "border-red-500" : "border-l-primaryAccent";

  return (
    <>
      <div
        className={`group/step relative flex items-start gap-1 overflow-hidden border-b border-l-2 border-themeBase-90 pl-1 pr-3 font-mono hover:bg-gray-100 ${
          isPaused || isPast ? color : "border-l-transparent"
        } ${isPaused ? "bg-gray-100" : "bg-testsuitesStepsBgcolor"}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <button
          onClick={onClick}
          className="flex flex-grow items-start space-x-2 overflow-hidden py-2 text-start"
        >
          <div title={"" + displayedProgress} className="flex h-4 items-center">
            <ProgressBar progress={displayedProgress} error={error} />
          </div>
          <div className="opacity-70">{index + 1}</div>
          <div
            className={`whitespace-pre font-medium text-bodyColor ${isPaused ? "font-bold" : ""}`}
          >
            {parentId ? "- " : ""}
            {stepName}
          </div>
          <div className="opacity-70">{argString}</div>
        </button>
        <TestStepActions
          onReplay={onReplay}
          onPlayFromHere={onPlayFromHere}
          isLastStep={isLastStep}
          isPaused={isPaused}
          onGoToLocation={onGoToLocation}
          onJumpToBefore={onJumpToBefore}
          onJumpToAfter={onJumpToAfter}
          duration={adjustedDuration}
        />
      </div>
      {selected && pauseId && <ConsoleProps pauseId={pauseId} consoleProps={consoleProps} />}
    </>
  );
}
function ConsoleProps({
  pauseId,
  consoleProps,
}: {
  pauseId?: string;
  consoleProps?: ProtocolObject;
}) {
  if (!pauseId || !consoleProps) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 p-2 pl-8">
      <div>Console Props</div>
      <PropertiesRenderer pauseId={pauseId} object={consoleProps} />
    </div>
  );
}
