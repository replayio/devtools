import Inspector from "@bvaughn/components/inspector";
import Loader from "@bvaughn/components/Loader";
import "@bvaughn/pages/inspector.css";
import { clientValueToProtocolValue } from "@bvaughn/src/utils/protocol";
import { Value as ProtocolValue } from "@replayio/protocol";
import { ValueItem } from "devtools/packages/devtools-reps";
import { ThreadFront } from "protocol/thread";
import { Suspense, useMemo } from "react";
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
    if (preview == null || !preview.hasOwnProperty("root") == null) {
      return null;
    }

    return clientValueToProtocolValue(preview?.root as ValueItem);
  }, [preview]);

  if (pause == null || pause.pauseId == null || protocolValue === null) {
    return null;
  }

  return (
    <div className="preview-popup">
      <Suspense fallback={<Loader />}>
        <Inspector pauseId={pause.pauseId!} protocolValue={protocolValue} />{" "}
      </Suspense>
    </div>
  );
}
