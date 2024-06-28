import type {
  Location,
  MappedLocation,
  ObjectPreview,
  Object as ProtocolObject,
} from "@replayio/protocol";

import { updateMappedLocation } from "replay-next/src/suspense/PauseCache";
import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { getPreferredLocation } from "replay-next/src/utils/sources";
import { ReplayClientInterface } from "shared/client/types";
import { SourceDetails } from "ui/reducers/sources";
import { findFunctionParent } from "ui/suspense/jumpToLocationCache";

import { findClassOutlineForLocation, findFunctionOutlineForLocation } from "./jumpToCode";

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
  classComponentName?: string;
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
  // or probably Playwright
  "SOURCE ",
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

export function locationToString(location: Location) {
  return `${location.sourceId}:${location.line}:${location.column}`;
}

export const formatFunctionDetailsFromLocation = async (
  replayClient: ReplayClientInterface,
  type: string,
  locationInFunction: Location | MappedLocation,
  framework?: string,
  mightBeComponent = false
): Promise<FormattedEventListener | undefined> => {
  const sourcesById = await sourcesByIdCache.readAsync(replayClient);
  let location: Location | undefined;
  if (Array.isArray(locationInFunction)) {
    updateMappedLocation(sourcesById, locationInFunction);
    location = getPreferredLocation(sourcesById, [], locationInFunction);
  } else {
    location = locationInFunction;
  }

  if (!location) {
    return;
  }

  const sourceDetails = sourcesById.get(location.sourceId);
  if (!sourceDetails) {
    return;
  }
  const locationUrl = sourceDetails.url;

  // See if we can get any better details from the parsed source outline
  const symbols = await sourceOutlineCache.readAsync(replayClient, location.sourceId);

  let functionOutline = findFunctionOutlineForLocation(location, symbols);
  const possibleMatchingClassDefinition = findClassOutlineForLocation(location, symbols);

  // Sometimes we don't find a valid function outline for this location.
  // This could be because we actually got a location for an entire class component,
  // or there could be some kind of other mismatch.
  if (!functionOutline) {
    if (mightBeComponent && possibleMatchingClassDefinition) {
      // If the caller is using this to format components, see if
      // we can find the `render()` method.  If so, use that so we
      // have _some_ function outline to work with here.
      const renderFunction = symbols.functions.find(
        f =>
          f.name === "render" &&
          f.location.begin.line >= possibleMatchingClassDefinition.location.begin.line &&
          f.location.end.line <= possibleMatchingClassDefinition.location.end.line
      );

      if (renderFunction) {
        functionOutline = renderFunction;
      }
    }

    if (!functionOutline) {
      return;
    }
  }

  const functionName = possibleMatchingClassDefinition?.name ?? functionOutline.name ?? "Anonymous";
  const functionParameterNames = functionOutline.parameters;

  return {
    type,
    sourceDetails,
    location,
    locationUrl,
    firstBreakablePosition: {
      sourceId: sourceDetails?.id,
      ...functionOutline.breakpointLocation!,
    },
    functionName: functionName || "Anonymous",
    functionParameterNames,
    framework,
    classComponentName: possibleMatchingClassDefinition?.name,
  };
};

export const formatClassComponent = async (
  replayClient: ReplayClientInterface,
  type: string,
  fnPreview: FunctionPreview,
  framework?: string
): Promise<FormattedEventListener | undefined> => {
  const { functionLocation } = fnPreview;
  const sourcesById = await sourcesByIdCache.readAsync(replayClient);
  updateMappedLocation(sourcesById, functionLocation);

  const location = getPreferredLocation(sourcesById, [], functionLocation);

  if (!location) {
    return;
  }

  const sourceDetails = sourcesById.get(location.sourceId);
  if (!sourceDetails) {
    return;
  }
  const locationUrl = sourceDetails.url;

  // See if we can get any better details from the parsed source outline
  const symbols = await sourceOutlineCache.readAsync(replayClient, location.sourceId);

  const classOutline = findClassOutlineForLocation(location, symbols);

  if (!classOutline) {
    return;
  }

  const functionName = classOutline.name!;

  const renderMethod = symbols.functions.find(
    f =>
      f.name === "render" &&
      f.location.begin.line > classOutline.location.begin.line &&
      f.location.end.line < classOutline.location.end.line
  )!;

  return {
    type,
    sourceDetails,
    location,
    locationUrl,
    firstBreakablePosition: {
      sourceId: sourceDetails?.id,
      ...(renderMethod?.breakpointLocation ?? { line: 0, column: 0 }),
    },
    functionName: functionName || "Anonymous()",
    functionParameterNames: [],
    framework,
  };
};
