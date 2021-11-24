import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";

function Match({ point, setViewMode, onSeek }: PropsFromRedux & { point: any; onSeek: any }) {
  // const selectSource = () => {};
  const { column, line, sourceId } = point.frame[0];
  const { time } = point;

  const selectSource = (...args: any) => {
    const dbg = gToolbox.getPanel("debugger");
    setViewMode("dev");
    dbg.selectSource(...args);
    onSeek(point, time, false);
  };

  return (
    <button
      className="flex justify-between w-full p-1 pl-4 hover:bg-gray-200"
      onClick={() => selectSource(sourceId, line, column)}
    >
      <div>Go to source</div>
      <div>
        0:{new Date(time).getSeconds().toString().padStart(2, "0")}:
        {new Date(time).getMilliseconds()}
      </div>
    </button>
  );
}

function Matches({ points, setViewMode, onSeek }: PropsFromRedux & { points: any[]; onSeek: any }) {
  console.log({ points });

  return (
    <div className="flex flex-col space-y-1 items-start w-full">
      <div className="w-full">
        {points.map((p, i) => (
          <Match point={p} key={i} setViewMode={setViewMode} onSeek={onSeek} />
        ))}
      </div>
    </div>
  );
}

const connector = connect(() => ({}), { setViewMode: actions.setViewMode });
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Matches);
