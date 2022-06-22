import { Value as ProtocolValue } from "@replayio/protocol";
import Inspector from "bvaughn-architecture-demo/components/inspector";
import "bvaughn-architecture-demo/pages/inspector.css";
import { preCacheObjects } from "bvaughn-architecture-demo/src/suspense/ObjectPreviews";
import { clientValueToProtocolValue } from "bvaughn-architecture-demo/src/utils/protocol";
import { ValueItem } from "devtools/packages/devtools-reps";
import { ThreadFront } from "protocol/thread";
import { useMemo } from "react";
import { useAppSelector } from "ui/setup/hooks";

import { getPreview } from "../../../selectors";

export default function NewObjectInspector() {
  const preview = useAppSelector(getPreview);
  const pause = ThreadFront.currentPause;

  // HACK
  // The new Object Inspector does not consume ValueFronts.
  // It works with the Replay protocol's Value objects directly.
  // At the moment this means that we need to convert the ValueFront back to a protocol Value.
  const protocolValue: ProtocolValue | null = useMemo(() => {
    if (pause == null || pause.pauseId == null) {
      return null;
    } else if (preview == null || !preview.hasOwnProperty("root") == null) {
      return null;
    }

    // TODO Move this into an action creator or whatever loads the Pause data.
    preCacheObjects(pause.pauseId, Array.from(pause.objects.values()));

    return clientValueToProtocolValue(preview?.root as ValueItem);
  }, [pause, preview]);

  if (pause == null || pause.pauseId == null || protocolValue === null) {
    return null;
  }

  return (
    <div className="preview-popup">
      <Inspector pauseId={pause.pauseId!} protocolValue={protocolValue} />{" "}
    </div>
  );
}
