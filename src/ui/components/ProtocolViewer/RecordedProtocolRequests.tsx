import { Suspense, useContext } from "react";

import Loader from "replay-next/components/Loader";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ProtocolViewer } from "ui/components/ProtocolViewer/components/ProtocolViewer";
import { recordedProtocolMessagesCache } from "ui/components/ProtocolViewer/suspense/recordedProtocolMessagesCache";
import { SourceDetails, getAllSourceDetails } from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";

export function RecordedProtocolRequests() {
  const sourceDetails = useAppSelector(getAllSourceDetails);

  return (
    <Suspense fallback={<Loader />}>
      <RecordedAppProtocolViewerSuspends sourceDetails={sourceDetails} />
    </Suspense>
  );
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
