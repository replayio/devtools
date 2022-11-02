import { FunctionComponent, Suspense, useEffect, useState } from "react";

import ErrorBoundary from "bvaughn-architecture-demo/components/ErrorBoundary";
import Initializer from "bvaughn-architecture-demo/components/Initializer";
import usePreferredColorScheme from "bvaughn-architecture-demo/src/hooks/usePreferredColorScheme";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { useReplayClientForTesting } from "shared/utils/client";
import { getFlag } from "shared/utils/url";

export default function createTest(Component: FunctionComponent<any>, defaultRecordingId: string) {
  function Test() {
    const [didMount, setDidMount] = useState(false);

    useEffect(() => {
      setDidMount(true);
    }, []);

    if (!didMount) {
      return null;
    }

    return (
      <ErrorBoundary>
        <Suspense fallback="Loading...">
          <Suspender />
        </Suspense>
      </ErrorBoundary>
    );
  }

  function Suspender() {
    usePreferredColorScheme();

    const recordingId = getFlag("recordingId") || defaultRecordingId;
    const replayClient = useReplayClientForTesting();

    return (
      <ReplayClientContext.Provider value={replayClient}>
        <Initializer recordingId={recordingId}>
          <Component />
        </Initializer>
      </ReplayClientContext.Provider>
    );
  }

  return Test;
}
