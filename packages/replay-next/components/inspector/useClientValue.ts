import { PauseId, Value as ProtocolValue } from "@replayio/protocol";
import { useContext, useMemo } from "react";

import {
  getCachedObject,
  getObjectWithPreviewSuspense,
} from "replay-next/src/suspense/ObjectPreviews";
import { Value as ClientValue, protocolValueToClientValue } from "replay-next/src/utils/protocol";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

export default function useClientValue(
  protocolValue: ProtocolValue,
  pauseId: PauseId
): ClientValue {
  const client = useContext(ReplayClientContext);

  const objectId = protocolValue.object;
  if (objectId != null && getCachedObject(pauseId, objectId) === null) {
    // If we are converting an object value, protocolValueToClientValue() will require preview data.
    // Typically we will have already cached this data from a previous request.
    // There may be edge cases where this is not true though (see BAC-2095).
    // As a workaround, just-in-time fetch the data before calling protocolValueToClientValue().
    getObjectWithPreviewSuspense(client, pauseId, objectId);
  }

  return useMemo(
    () => protocolValueToClientValue(pauseId, protocolValue),
    [pauseId, protocolValue]
  );
}
