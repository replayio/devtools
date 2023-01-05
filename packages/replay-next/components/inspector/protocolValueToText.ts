import {
  PauseId,
  NamedValue as ProtocolNamedValue,
  Value as ProtocolValue,
} from "@replayio/protocol";

import { dateProtocolObjectToString } from "replay-next/components/inspector/values/DateRenderer";
import { errorProtocolObjectToString } from "replay-next/components/inspector/values/ErrorRenderer";
import { regExpProtocolObjectToString } from "replay-next/components/inspector/values/RegExpRenderer";
import { getObjectWithPreviewHelper } from "replay-next/src/suspense/ObjectPreviews";
import { protocolValueToClientValue } from "replay-next/src/utils/protocol";
import { ReplayClientInterface } from "shared/client/types";

export default async function protocolValueToText(
  client: ReplayClientInterface,
  protocolValue: ProtocolValue | ProtocolNamedValue,
  pauseId: PauseId
): Promise<string | null> {
  const clientValue = protocolValueToClientValue(pauseId, protocolValue);

  if (clientValue.objectId) {
    let valueToCopy: string | null = null;

    const object = await getObjectWithPreviewHelper(client, pauseId, clientValue.objectId);
    if (object) {
      switch (clientValue.type) {
        case "array":
          console.log("TODO [FE-989]", object);
          break;
        case "date":
          valueToCopy = dateProtocolObjectToString(object);
          break;
        case "error":
          valueToCopy = errorProtocolObjectToString(object);
          break;
        case "function":
          // Nothing meaningful to copy
          break;
        case "html-element":
        case "html-text":
          console.log("TODO [FE-989]", object);
          break;
        case "map":
          console.log("TODO [FE-989]", object);
          break;
        case "regexp":
          valueToCopy = regExpProtocolObjectToString(object);
          break;
        case "set":
          console.log("TODO [FE-989]", object);
          break;
        case "object":
          console.log("TODO [FE-989]", object);
          break;
      }
    }

    return valueToCopy;
  } else if (clientValue.preview) {
    return clientValue.preview;
  } else {
    return null;
  }
}
