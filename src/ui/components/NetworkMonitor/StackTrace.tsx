import React, { Suspense } from "react";
import Frames from "devtools/client/debugger/src/components/SecondaryPanes/Frames/NewFrames";
import { RequestSummary } from "./utils";
import { getPauseIdForPointSuspense } from "ui/suspense/util";

function StackTrace({ request }: { request: RequestSummary }) {
  const pauseId = getPauseIdForPointSuspense(request.point.point, request.point.time);
  return (
    <div className="call-stack-pane">
      <h1 className="py-2 px-4 font-bold">Stack Trace</h1>
      <div className="px-2">
        <Frames pauseId={pauseId} panel="networkmonitor" />
      </div>
    </div>
  );
}

export default function StackTraceSuspenseWrapper({ request }: { request: RequestSummary }) {
  return (
    <Suspense>
      <StackTrace request={request} />
    </Suspense>
  );
}
