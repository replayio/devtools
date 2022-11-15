import { Location } from "@replayio/protocol";

import { seekToTime, setTimelineToTime } from "ui/actions/timeline";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { TestItem } from "ui/types";

import { selectLocation } from "../../actions/sources";
import { getThreadContext } from "../../selectors";

export function TestSteps({
  test,
  startTime,
  location,
}: {
  test: TestItem;
  startTime: number;
  location?: Location;
}) {
  const { steps } = test;

  return (
    <div className="flex flex-col rounded-lg py-2 pl-11">
      {steps?.map((s, i) => (
        <TestStepItem
          testName={s.name}
          key={i}
          index={i}
          startTime={startTime + s.relativeStartTime}
          duration={s.duration}
          argString={s.args?.toString()}
          parentId={s.parentId}
          location={location}
        />
      ))}
      {test.error ? (
        <div className="border-l-2 border-red-500 bg-testsuitesErrorBgcolor text-testsuitesErrorColor">
          <div className="flex flex-row items-center space-x-1 p-2">
            <Icon filename="warning" size="small" className="bg-testsuitesErrorColor" />
            <div className="font-bold">Error</div>
          </div>
          <div className="wrap space-y-1 overflow-hidden bg-testsuitesErrorBgcolor p-2 font-mono">
            {test.error.message}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TestStepItem({
  testName,
  startTime,
  duration,
  argString,
  index,
  parentId,
  location,
}: {
  testName: string;
  startTime: number;
  duration: number;
  argString: string;
  index: number;
  parentId?: string;
  location?: Location;
}) {
  const cx = useAppSelector(getThreadContext);
  const currentTime = useAppSelector(getCurrentTime);
  const dispatch = useAppDispatch();
  // some chainers (`then`) don't have a duration, so let's bump it here so that it shows something in the UI
  const paused = currentTime >= startTime && currentTime < startTime + (duration || 1);

  const onClick = () => {
    dispatch(seekToTime(startTime));
  };
  const onMouseEnter = () => {
    dispatch(setTimelineToTime(startTime));
  };
  const onMouseLeave = () => {
    dispatch(setTimelineToTime(currentTime));
  };

  const onLocationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (location) {
      dispatch(selectLocation(cx, location));
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center overflow-hidden border-b border-l-4 border-themeBase-90 bg-testsuitesStepsBgcolor pl-1 pr-3 font-mono ${
        paused ? "border-l-red-500" : "border-l-transparent"
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex flex-grow items-center space-x-2 overflow-hidden py-2 text-start">
        <div className="opacity-70">{index + 1}</div>
        <div className={`whitespace-pre font-medium text-bodyColor ${paused ? "font-bold" : ""}`}>
          {parentId ? "- " : ""}
          {testName}
        </div>
        <div className="opacity-70">{argString}</div>
      </div>
      {location ? (
        <div
          onClick={onLocationClick}
          title="Go To Source"
          className="invisible grid h-5 w-5 items-center justify-center hover:bg-menuHoverBgcolor group-hover:visible"
        >
          <MaterialIcon>file_open</MaterialIcon>
        </div>
      ) : null}
    </div>
  );
}
