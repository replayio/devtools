import { FunctionComponent, Suspense } from "react";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import Initializer from "replay-next/components/Initializer";
import usePreferredColorScheme from "replay-next/src/hooks/usePreferredColorScheme";
import { getFlag } from "shared/utils/url";

export default function createTest(Component: FunctionComponent<any>, defaultRecordingId: string) {
  const recordingId = getFlag("recordingId") || defaultRecordingId;

  return function Test() {
    usePreferredColorScheme();

    return (
      <InlineErrorBoundary name="createTest">
        <Suspense fallback="Loading...">
          <Initializer recordingId={recordingId}>
            <Component />
          </Initializer>
        </Suspense>
      </InlineErrorBoundary>
    );
  };
}
