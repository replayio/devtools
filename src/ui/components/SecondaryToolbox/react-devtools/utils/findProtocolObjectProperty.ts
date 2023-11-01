import {
  NamedValue,
  Object as ProtocolObject,
  Property as ProtocolProperty,
} from "@replayio/protocol";

export function findProtocolObjectProperty(
  sourceObject: ProtocolObject,
  name: string
): ProtocolProperty | NamedValue | null {
  return (
    sourceObject.preview?.properties?.find(property => property.name === name) ??
    sourceObject.preview?.getterValues?.find(property => property.name === name) ??
    null
  );
}
