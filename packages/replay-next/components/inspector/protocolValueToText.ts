import {
  ObjectId,
  PauseId,
  NamedValue as ProtocolNamedValue,
  Value as ProtocolValue,
} from "@replayio/protocol";

import { errorProtocolObjectToString } from "replay-next/components/inspector/values/ErrorRenderer";
import { functionProtocolObjectToString } from "replay-next/components/inspector/values/FunctionRenderer";
import { regExpProtocolObjectToString } from "replay-next/components/inspector/values/RegExpRenderer";
import { clientValueCache, objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { filterNonEnumerableProperties } from "replay-next/src/utils/protocol";
import { ReplayClientInterface } from "shared/client/types";

const MAX_DEPTH_TO_COPY = 5;

export default async function protocolValueToText(
  client: ReplayClientInterface,
  protocolValue: ProtocolValue | ProtocolNamedValue,
  pauseId: PauseId
): Promise<string | null> {
  const objectIdSet: Set<ObjectId> = new Set();

  return protocolValueToTextHelper(client, protocolValue, pauseId, objectIdSet, 0, false);
}

async function protocolValueToTextHelper(
  client: ReplayClientInterface,
  protocolValue: ProtocolValue | ProtocolNamedValue,
  pauseId: PauseId,
  objectIdSet: Set<ObjectId>,
  depth: number,
  includeName: boolean
): Promise<string | null> {
  let nameToCopy: string | null = null;
  let valueToCopy: string | null = null;

  if (includeName) {
    if (isProtocolNamedValue(protocolValue)) {
      nameToCopy = protocolValue.name;
    }
  }

  if (depth > MAX_DEPTH_TO_COPY) {
    valueToCopy = '"[[ Truncated ]]"';
  } else {
    const clientValue = await clientValueCache.readAsync(client, pauseId, protocolValue);

    const { objectId, type } = clientValue;

    if (objectId) {
      if (objectIdSet.has(objectId)) {
        valueToCopy = '"[[ Circular ]]"';
      } else {
        objectIdSet.add(objectId);

        const object = await objectCache.readAsync(client, pauseId, objectId, "full");
        if (object && object.preview) {
          switch (type) {
            case "date": {
              const dateTime = object?.preview?.dateTime;
              const string = dateTime ? new Date(dateTime).toISOString() : "Date";
              valueToCopy = JSON.stringify(string);
              break;
            }
            case "error": {
              valueToCopy = JSON.stringify(
                await errorProtocolObjectToString(client, pauseId, object)
              );
              break;
            }
            case "function": {
              valueToCopy = JSON.stringify(functionProtocolObjectToString(object));
              break;
            }
            case "regexp": {
              valueToCopy = regExpProtocolObjectToString(object);
              break;
            }
            default: {
              switch (type) {
                case "array": {
                  const properties = object.preview.properties ?? [];
                  const mappedValues = await Promise.all(
                    properties
                      .filter(property => property.name !== "length")
                      .map(property =>
                        protocolValueToTextHelper(
                          client,
                          property,
                          pauseId,
                          objectIdSet,
                          depth + 1,
                          false
                        )
                      )
                  );
                  valueToCopy = `[${mappedValues.join(", ")}]`;
                  break;
                }
                case "html-element": {
                  const {
                    attributes,
                    childNodes = [],
                    nodeName = "unknown",
                  } = object.preview?.node ?? {};

                  const tagName = nodeName.toLowerCase();
                  const properties = filterNonEnumerableProperties(attributes ?? []);

                  const mappedChildren = [];
                  for (let i = 0; i < childNodes.length; i++) {
                    const childNodeId = childNodes[i];
                    const protocolValue = { object: childNodeId };
                    mappedChildren.push(
                      await protocolValueToTextHelper(
                        client,
                        protocolValue,
                        pauseId,
                        objectIdSet,
                        depth + 1,
                        false
                      )
                    );
                  }

                  const mappedAttributes = [];
                  if (properties.length > 0) {
                    for (const property of properties) {
                      const clientValue = await clientValueCache.readAsync(
                        client,
                        pauseId,
                        property
                      );

                      mappedAttributes.push(`${clientValue.name}="${clientValue.preview ?? ""}"`);
                    }
                  }

                  const openTag =
                    mappedAttributes.length > 0
                      ? `<${tagName} ${mappedAttributes.join(" ")}`
                      : `<${tagName}`;

                  valueToCopy =
                    mappedChildren.length > 0
                      ? `${openTag}>${mappedChildren.join(" ")}</${tagName}>`
                      : `${openTag} />`;
                  break;
                }
                case "html-text": {
                  valueToCopy = object.preview.node?.nodeValue ?? "";
                  break;
                }
                case "map": {
                  const containerEntries = object.preview.containerEntries ?? [];

                  let mappedValues = [];
                  for (const containerEntry of containerEntries) {
                    const key = await protocolValueToTextHelper(
                      client,
                      containerEntry.key!,
                      pauseId,
                      objectIdSet,
                      depth + 1,
                      false
                    );
                    const value = await protocolValueToTextHelper(
                      client,
                      containerEntry.value,
                      pauseId,
                      objectIdSet,
                      depth + 1,
                      false
                    );

                    mappedValues.push(`[${key}, ${value}]`);
                  }

                  valueToCopy = `[${mappedValues.join(", ")}]`;
                  break;
                }
                case "object": {
                  const properties = object.preview.properties ?? [];
                  const mappedValues = await Promise.all(
                    properties.map(property =>
                      protocolValueToTextHelper(
                        client,
                        property,
                        pauseId,
                        objectIdSet,
                        depth + 1,
                        true
                      )
                    )
                  );
                  valueToCopy = `{${mappedValues.join(", ")}}`;
                  break;
                }
                case "set": {
                  const containerEntries = object.preview.containerEntries ?? [];
                  const mappedValues = await Promise.all(
                    containerEntries.map(containerEntry =>
                      protocolValueToTextHelper(
                        client,
                        containerEntry.value,
                        pauseId,
                        objectIdSet,
                        depth + 1,
                        false
                      )
                    )
                  );
                  valueToCopy = `[${mappedValues.join(", ")}]`;
                  break;
                }
              }
              break;
            }
          }
        }
      }
    } else if (clientValue.preview) {
      switch (type) {
        case "nan":
          valueToCopy = "NaN";
          break;
        case "string":
        case "symbol":
          valueToCopy = JSON.stringify(clientValue.preview);
          break;
        case "undefined":
          valueToCopy = "undefined";
          break;
        default:
          valueToCopy = clientValue.preview;
          break;
      }
    }
  }

  if (nameToCopy) {
    return `"${nameToCopy}": ${valueToCopy ?? "undefined"}`;
  } else {
    return valueToCopy;
  }
}

function isProtocolNamedValue(
  value: ProtocolNamedValue | ProtocolValue
): value is ProtocolNamedValue {
  return value.hasOwnProperty("name");
}
