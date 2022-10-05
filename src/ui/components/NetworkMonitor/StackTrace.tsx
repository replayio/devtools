import React from "react";
import { useAppDispatch } from "ui/setup/hooks";
import { seekToRequestFrame } from "ui/actions/network";
import { PauseFrames } from "devtools/client/debugger/src/components/SecondaryPanes/Frames/NewFrames";
import { RequestSummary } from "./utils";
import { PauseFrame } from "devtools/client/debugger/src/reducers/pause";

export const StackTrace = ({
  frames,
  request,
}: {
  frames: PauseFrame[];
  request: RequestSummary;
}) => {
  const dispatch = useAppDispatch();
  const selectFrame = async (cx: any, frame: any) => {
    dispatch(seekToRequestFrame(request, frame, cx));
  };

  return (
    <div>
      <h1 className="py-2 px-4 font-bold">Stack Trace</h1>
      <div className="px-2">
        <div className="pane frames">
          <div role="list">
            <PauseFrames frames={frames} panel="networkmonitor" selectFrame={selectFrame} />
          </div>
        </div>
      </div>
    </div>
  );
};
