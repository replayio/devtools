import { ObjectId } from "@replayio/protocol";
import { ElementType } from "@replayio/react-devtools-inline";

// TRICKY
// Keep the types below in sync with react-devtools-inline package

export type ReactElement = {
  children: Array<number>;
  depth: number;
  displayName: string | null;
  hocDisplayNames: null | Array<string>;
  id: number;
  isCollapsed: boolean;
  key: number | string | null;
  ownerID: number;
  parentID: number;
  type: ElementType;
  weight: number;

  // Replay does not use these attributes
  isStrictModeNonCompliant: boolean;
};

export interface SerializedReactElement {
  type: ElementType;
  displayName: string | null;
  id: number;
  key: number | string | null;
  hocDisplayNames: string[] | null;
}

export type Dehydrated = {
  inspectable: boolean;
  name: string | null;
  preview_long: string | null;
  preview_short: string | null;
  readonly?: boolean;
  size?: number;
  type: string;
};

// Typed arrays and other complex iteratable objects (e.g. Map, Set, ImmutableJS) need special handling.
// These objects can't be serialized without losing type information,
// so a "Unserializable" type wrapper is used (with meta-data keys) to send nested values-
// while preserving the original type and name.
export type Unserializable = {
  name: string | null;
  preview_long: string | null;
  preview_short: string | null;
  readonly?: boolean;
  size?: number;
  type: string;
  unserializable: boolean;
  string?: any;
  number?: any;
};

type Data =
  | string
  | Dehydrated
  | Unserializable
  | Array<Dehydrated>
  | Array<Unserializable>
  | { [key: string]: Data };

export type DehydratedData = {
  cleaned: Array<Array<string | number>>;
  data: Data;
  unserializable: Array<Array<string | number>>;
};

export type HooksNode = {
  hookSource?: {
    lineNumber: number | null;
    columnNumber: number | null;
    fileName: string | null;
    functionName: string | null;
  };
  id: number | null;
  isStateEditable: boolean;
  name: string;
  subHooks: Array<HooksNode>;
  value: unknown;
};

export type InspectedReactElement = {
  canViewSource: boolean;
  context: DehydratedData | null;
  hooks: DehydratedData | null;
  id: number;
  key: number | string | null;
  owners: SerializedReactElement[] | null;
  props: DehydratedData | null;
  source: {
    fileName: string;
    lineNumber: number;
  } | null;
  state: DehydratedData | null;
  type: ElementType;

  // Replay adds these attributes for the new React DevTools
  changedContextKeys: string[];
  changedHooksIds: number[];
  changedPropsKeys: string[];
  changedStateKeys: string[];
  contextObjectId: ObjectId | null;
  hooksObjectId: ObjectId | null;
  propsObjectId: ObjectId | null;
  stateObjectId: ObjectId | null;
  typeObjectId: ObjectId | null;

  // Replay does not use these attributes
  canEditHooks: boolean;
  canEditFunctionProps: boolean;
  canEditHooksAndDeletePaths: boolean;
  canEditHooksAndRenamePaths: boolean;
  canEditFunctionPropsDeletePaths: boolean;
  canEditFunctionPropsRenamePaths: boolean;
  canToggleError: boolean;
  canToggleSuspense: boolean;
  errors: Array<[string, number]>;
  hasLegacyContext: boolean;
  isErrored: boolean;
  plugins: any;
  rootType: string | null;
  rendererPackageName: string | null;
  rendererVersion: string | null;
  targetErrorBoundaryID: number | null | undefined;
  warnings: Array<[string, number]>;
};
