import {
  Location as ProtocolLocation,
  MappedLocation as ProtocolMappedLocation,
} from "@replayio/protocol";
import { ReplayClientInterface } from "shared/client/types";
import { createGenericCache } from "./GenericCache";

export const { getValue: getMappedLocation } = createGenericCache<
  [ReplayClientInterface, ProtocolLocation],
  ProtocolMappedLocation
>(
  (client, location) => client.getMappedLocation(location),
  (client, location) => `${location.sourceId}:${location.line}:${location.column}`
);
