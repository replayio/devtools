import { Object as ProtocolObject } from "@replayio/protocol";

import { findProtocolObjectProperty } from "ui/components/SecondaryToolbox/react-devtools/utils/findProtocolObjectProperty";

export function findProtocolObjectPropertyValue<Type>(
  sourceObject: ProtocolObject,
  name: string
): Type | null {
  return findProtocolObjectProperty(sourceObject, name)?.value ?? null;
}
