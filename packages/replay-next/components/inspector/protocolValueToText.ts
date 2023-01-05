import {
  PauseId,
  NamedValue as ProtocolNamedValue,
  Value as ProtocolValue,
} from "@replayio/protocol";

import { ReplayClientInterface } from "shared/client/types";

import { dateProtocolObjectToString } from "replay-next/components/inspector/values/DateRenderer";
import { errorProtocolObjectToString } from "replay-next/components/inspector/values/ErrorRenderer";
import { regExpProtocolObjectToString } from "replay-next/components/inspector/values/RegExpRenderer";
import { getObjectWithPreviewHelper } from "replay-next/src/suspense/ObjectPreviews";
import { protocolValueToClientValue } from "replay-next/src/utils/protocol";
import { functionProtocolObjectToString } from "replay-next/components/inspector/values/FunctionRenderer";

export default async function protocolValueToText(
  client: ReplayClientInterface,
  protocolValue: ProtocolValue | ProtocolNamedValue,
  pauseId: PauseId,
  depth: number = 0
): Promise<string | null> {
  const clientValue = protocolValueToClientValue(pauseId, protocolValue);

  let nameToCopy: string | null = null;
  let valueToCopy: string | null = null;

  if (depth > 0) {
    if (isProtocolNamedValue(protocolValue)) {
      nameToCopy = protocolValue.name;
    }
  }

  if (clientValue.objectId) {
    const object = await getObjectWithPreviewHelper(client, pauseId, clientValue.objectId);
    if (object && object.preview) {
      switch (clientValue.type) {
        case "date": {
          valueToCopy = dateProtocolObjectToString(object);
          break;
        }
        case "error": {
          valueToCopy = errorProtocolObjectToString(object);
          break;
        }
        case "function": {
          valueToCopy = functionProtocolObjectToString(object);
          break;
        }
        case "regexp": {
          valueToCopy = regExpProtocolObjectToString(object);
          break;
        }
        default: {
          const properties = object.preview.properties ?? [];
          const mappedValues = await Promise.all(
            properties.map(property => protocolValueToText(client, property, pauseId, depth + 1))
          );

          switch (clientValue.type) {
            case "array":
              valueToCopy = `[${mappedValues.join(", ")}]`;
              break;
            case "html-element":
            case "html-text":
              console.log("TODO [FE-989]", object);
              break;
            case "map":
              valueToCopy = `Map([${mappedValues.join(", ")}])`;
              break;
            case "object":
              valueToCopy = `{${mappedValues.join(", ")}}`;
              break;
            case "set":
              valueToCopy = `Set(${mappedValues.join(", ")})`;
              break;
          }
          break;
        }
      }
    }
  } else if (clientValue.preview) {
    valueToCopy = clientValue.preview;
  }

  if (nameToCopy) {
    return `"${nameToCopy}": ${JSON.stringify(valueToCopy) ?? "undefined"}`;
  } else {
    return valueToCopy;
  }
}

function isProtocolNamedValue(
  value: ProtocolNamedValue | ProtocolValue
): value is ProtocolNamedValue {
  return value.hasOwnProperty("name");
}
