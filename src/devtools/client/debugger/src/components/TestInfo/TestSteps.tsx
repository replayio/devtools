import { seekToTime } from "ui/actions/timeline";
import Icon from "ui/components/shared/Icon";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { TestItem } from "ui/types";

export function TestSteps({ test, startTime }: { test: TestItem; startTime: number }) {
  const { steps } = test;

  return (
    <div className="flex flex-col py-2 rounded-lg pl-11">
      {steps?.map((s, i) => (
        <TestStepItem
          testName={s.name}
          key={i}
          startTime={startTime + s.relativeStartTime}
          argString={s.args?.toString()}
        />
      ))}
      {test.error ? (
        <div className="border-l-2 border-red-500 bg-testsuitesErrorBgcolor text-testsuitesErrorColor">
          <div className="flex flex-row items-center p-2 space-x-1">
            <Icon filename="warning" size="small" className="bg-testsuitesErrorColor" />
            <div className="font-bold">Error</div>
          </div>
          <div className="p-2 space-y-1 overflow-hidden font-mono wrap bg-testsuitesErrorBgcolor">
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
}: {
  testName: string;
  startTime: number;
  argString: string;
}) {
  const currentTime = useAppSelector(getCurrentTime);
  const dispatch = useAppDispatch();

  const onClick = (time: number) => {
    dispatch(seekToTime(time));
  };

  return (
    <button
      onClick={() => onClick(startTime)}
      className="flex items-center justify-between px-3 py-2 overflow-hidden font-mono border-b border-themeBase-90 bg-testsuitesStepsBgcolor"
    >
      <div className="flex items-center space-x-2 overflow-hidden">
        <div className="font-medium text-bodyColor">{testName}</div>
        <div className="opacity-70">{argString}</div>
        {currentTime === startTime ? <div>paused</div> : null}
      </div>
    </button>
  );
}
