import React, { Suspense, useContext } from "react";

import Frames from "devtools/client/debugger/src/components/SecondaryPanes/Frames/NewFrames";
import { getPauseIdSuspense } from "replay-next/src/suspense/PauseCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { RequestSummary } from "./utils";

function StackTrace({ request }: { request: RequestSummary }) {
  const client = useContext(ReplayClientContext);
  const pauseId = getPauseIdSuspense(client, request.point.point, request.point.time);
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
