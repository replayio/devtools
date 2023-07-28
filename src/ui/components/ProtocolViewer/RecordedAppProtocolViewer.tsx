import React, { Suspense, useContext, useMemo } from "react";

import Loader from "replay-next/components/Loader";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ProtocolViewer } from "ui/components/ProtocolViewer/components/ProtocolViewer";
import { recordedProtocolMessagesCache } from "ui/components/ProtocolViewer/suspense/recordedProtocolMessagesCache";
import { SourceDetails, getAllSourceDetails } from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";

export function RecordedAppProtocolViewer() {
  const sourceDetails = useAppSelector(getAllSourceDetails);

  const isRecordingOfReplay = useMemo(() => {
    const hasKnownReplaySources = sourceDetails.some(source => {
      return (
        source.url?.includes("src/ui/setup/store.ts") ||
        source.url?.includes("src/ui/setup/dynamic/devtools.ts")
      );
    });

    return hasKnownReplaySources;
  }, [sourceDetails]);

  let content: React.ReactNode;

  if (sourceDetails.length === 0) {
    content = <h3>Loading sources...</h3>;
  } else if (!isRecordingOfReplay) {
    content = <h3>Not a recording of Replay</h3>;
  } else {
    content = (
      <Suspense fallback={<Loader />}>
        <RecordedAppProtocolViewerSuspends sourceDetails={sourceDetails} />
      </Suspense>
    );
  }

  return content;
}

function RecordedAppProtocolViewerSuspends({ sourceDetails }: { sourceDetails: SourceDetails[] }) {
  const replayClient = useContext(ReplayClientContext);
  const { range: focusRange } = useContext(FocusContext);

  const allProtocolMessages = focusRange
    ? recordedProtocolMessagesCache.read(replayClient, sourceDetails, {
        begin: focusRange.begin.point,
        end: focusRange.end.point,
      })
    : { errorMap: {}, requestMap: {}, responseMap: {} };

  return <ProtocolViewer {...allProtocolMessages} />;
}
