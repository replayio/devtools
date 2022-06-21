import { WiredFrame } from "protocol/thread/pause";
import React from "react";
import { useAppDispatch } from "ui/setup/hooks";
import { seekToRequestFrame } from "ui/actions/network";
import { Frames } from "devtools/client/debugger/src/components/SecondaryPanes/Frames";
import { RequestSummary } from "./utils";

export const StackTrace = ({
  cx,
  frames,
  request,
}: {
  cx: any;
  frames: WiredFrame[];
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
        <Frames cx={cx} frames={frames} selectFrame={selectFrame} frameworkGroupingOn={true} />
      </div>
    </div>
  );
};
