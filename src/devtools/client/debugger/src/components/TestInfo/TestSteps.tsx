import { seekToTime, setTimelineToTime } from "ui/actions/timeline";
import Icon from "ui/components/shared/Icon";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { TestItem } from "ui/types";

export function TestSteps({ test, startTime }: { test: TestItem; startTime: number }) {
  const { steps } = test;

  return (
    <div className="flex flex-col rounded-lg py-2 pl-11">
      {steps?.map((s, i) => (
        <TestStepItem
          testName={s.name}
          key={i}
          index={i}
          startTime={startTime + s.relativeStartTime}
          argString={s.args?.toString()}
          parentId={s.parentId}
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
  argString,
  index,
  parentId,
}: {
  testName: string;
  startTime: number;
  argString: string;
  index: number;
  parentId?: string;
}) {
  const currentTime = useAppSelector(getCurrentTime);
  const dispatch = useAppDispatch();
  const paused = currentTime === startTime;

  const onClick = () => {
    dispatch(seekToTime(startTime));
  };
  const onMouseEnter = () => {
    dispatch(setTimelineToTime(startTime));
  };
  const onMouseLeave = () => {
    dispatch(setTimelineToTime(currentTime));
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between overflow-hidden border-b border-themeBase-90 bg-testsuitesStepsBgcolor px-3 py-2 font-mono"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center space-x-2 overflow-hidden text-start">
        <div className="opacity-70">{index + 1}</div>
        <div className={`font-medium text-bodyColor ${paused ? "font-bold" : ""}`}>
          {parentId ? "- " : ""}
          {testName}
        </div>
        <div className="opacity-70">{argString}</div>
      </div>
    </button>
  );
}
