import type { Location, ObjectPreview, Object as ProtocolObject } from "@replayio/protocol";

import { updateMappedLocation } from "replay-next/src/suspense/PauseCache";
import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientInterface } from "shared/client/types";
import { SourceDetails, SourcesState, getPreferredLocation } from "ui/reducers/sources";

import { InteractionEventKind } from "./constants";
import { findFunctionOutlineForLocation } from "./jumpToCode";

export type FunctionPreview = Required<
  Pick<ObjectPreview, "functionName" | "functionLocation" | "functionParameterNames">
>;

export interface EventListenerWithFunctionInfo {
  type: string;
  functionName: string;
  locationUrl?: string;
  location: Location;
  firstBreakablePosition: Location;
  functionParameterNames: string[];
  framework?: string;
}

export type FunctionWithPreview = Omit<ProtocolObject, "preview"> & {
  preview: FunctionPreview;
};

// TS magic: https://stackoverflow.com/a/57837897/62937
type DeepRequired<T, P extends string[]> = T extends object
  ? Omit<T, Extract<keyof T, P[0]>> &
      Required<{
        [K in Extract<keyof T, P[0]>]: NonNullable<DeepRequired<T[K], ShiftUnion<P>>>;
      }>
  : T;

// Analogues to array.prototype.shift
export type Shift<T extends any[]> = ((...t: T) => any) extends (
  first: any,
  ...rest: infer Rest
) => any
  ? Rest
  : never;

// use a distributed conditional type here
type ShiftUnion<T> = T extends any[] ? Shift<T> : never;

export type NodeWithPreview = DeepRequired<
  ProtocolObject,
  ["preview", "node"] | ["preview", "getterValues"]
>;

export const isFunctionPreview = (obj?: ObjectPreview): obj is FunctionPreview => {
  return !!obj && "functionName" in obj && "functionLocation" in obj;
};

export const isFunctionWithPreview = (obj: ProtocolObject): obj is FunctionWithPreview => {
  return (
    (obj.className === "Function" || obj.className === "AsyncFunction") &&
    isFunctionPreview(obj.preview)
  );
};

export const IGNORABLE_PARTIAL_SOURCE_URLS = [
  // Don't jump into React internals
  "react-dom",
  // or CodeSandbox
  "webpack:///src/sandbox/",
  "webpack:///sandpack-core/",
  "webpack:////home/circleci/codesandbox-client",
  // or Cypress
  "__cypress/runner/",
];

export const MORE_IGNORABLE_PARTIAL_URLS = IGNORABLE_PARTIAL_SOURCE_URLS.concat(
  // Ignore _any_ 3rd-party package for now
  "node_modules"
);

export function shouldIgnoreEventFromSource(
  sourceDetails?: SourceDetails,
  ignorableURLS = IGNORABLE_PARTIAL_SOURCE_URLS
) {
  const url = sourceDetails?.url ?? "";

  return ignorableURLS.some(partialUrl => url.includes(partialUrl));
}

export type FormattedEventListener = EventListenerWithFunctionInfo & {
  sourceDetails?: SourceDetails;
};

export const formatEventListener = async (
  replayClient: ReplayClientInterface,
  type: string,
  fnPreview: FunctionPreview,
  sourcesState: SourcesState,
  framework?: string
): Promise<FormattedEventListener | undefined> => {
  const { functionLocation } = fnPreview;
  const sources = await sourcesByIdCache.readAsync(replayClient);
  updateMappedLocation(sources, functionLocation);

  const location = getPreferredLocation(sourcesState, functionLocation);

  if (!location) {
    return;
  }

  const sourceDetails = sourcesState.sourceDetails.entities[location.sourceId];
  if (!sourceDetails) {
    return;
  }
  const locationUrl = sourceDetails.url;

  // See if we can get any better details from the parsed source outline
  const symbols = await sourceOutlineCache.readAsync(replayClient, location.sourceId);

  const functionOutline = findFunctionOutlineForLocation(location, symbols);

  if (!functionOutline?.breakpointLocation) {
    return;
  }

  const functionName = functionOutline.name!;
  const functionParameterNames = functionOutline.parameters;

  return {
    type,
    sourceDetails,
    location,
    locationUrl,
    firstBreakablePosition: {
      sourceId: sourceDetails?.id,
      ...functionOutline.breakpointLocation,
    },
    functionName: functionName || "Anonymous()",
    functionParameterNames,
    framework,
  };
};
