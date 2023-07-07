import { FunctionComponent, Suspense } from "react";

import ErrorBoundary from "replay-next/components/ErrorBoundary";
import Initializer from "replay-next/components/Initializer";
import usePreferredColorScheme from "replay-next/src/hooks/usePreferredColorScheme";
import { getFlag } from "shared/utils/url";

export default function createTest(Component: FunctionComponent<any>, defaultRecordingId: string) {
  const recordingId = getFlag("recordingId") || defaultRecordingId;

  return function Test() {
    usePreferredColorScheme();

    return (
      <ErrorBoundary name="createTest">
        <Suspense fallback="Loading...">
          <Initializer recordingId={recordingId}>
            <Component />
          </Initializer>
        </Suspense>
      </ErrorBoundary>
    );
  };
}
