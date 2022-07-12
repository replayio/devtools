// Debugger-related TS types
// Ported from Mozilla source:
// https://hg.mozilla.org/mozilla-central/file/fd9f980e368173439465e38f6257557500f45c02/devtools/client/debugger/src/types.js
// Converted with: https://flow-to-ts.netlify.app

import type { Location, SourceKind } from "@replayio/protocol";
import type { CallDeclaration } from "./ast";

export type SearchModifiers = {
  caseSensitive: boolean;
  wholeWord: boolean;
  regexMatch: boolean;
};
export type URL = string;
export type Mode =
  | String
  | {
      name: string;
      typescript?: boolean;
      base?: {
        name: string;
        typescript: boolean;
      };
    };
export type ThreadId = string;

/**
 * Source ID
 *
 * @memberof types
 * @static
 */
export type SourceId = string;

/**
 * Actor ID
 *
 * @memberof types
 * @static
 */
export type QueuedSourceData =
  | {
      type: "original";
      data: OriginalSourceData;
    }
  | {
      type: "generated";
      data: GeneratedSourceData;
    };
export type OriginalSourceData = {
  id: string;
  url: URL;
};
export type GeneratedSourceData = {
  thread: ThreadId;
  source: unknown;
  isServiceWorker: boolean;
  // Many of our tests rely on being able to set a specific ID for the Source
  // object. We may want to consider avoiding that eventually.
  id?: string;
};

/**
 * Source File Location
 *
 * @memberof types
 * @static
 */
export type SourceLocation = {
  readonly sourceId: SourceId;
  readonly line: number;
  readonly column?: number;
  readonly sourceUrl?: string;
};
export type MappedLocation = {
  readonly location: SourceLocation;
  readonly generatedLocation: SourceLocation;
};
export type PartialPosition = {
  readonly line: number;
  readonly column?: number;
};
export type Position = {
  readonly line: number;
  readonly column: number;
};
export type PartialRange = {
  end: PartialPosition;
  start: PartialPosition;
};
export type Range = {
  end: Position;
  start: Position;
};
export type PendingLocation = {
  readonly line: number;
  readonly column?: number;
  readonly sourceUrl?: string;
};

export type ASTLocation = {
  readonly name: string | null | undefined;
  readonly offset: PartialPosition;
  readonly index: number;
};

// Usually, we use source ID's to identify sources. However, source IDs are not
// stable across sessions. Instead, we use URLs with content-hashes to identify
// sources when storing locations that might be used across sessions.
export interface StableLocation extends SourceLocation {
  contentHash: string;
  kind: SourceKind;
  url: string;
}

/**
 * Breakpoint is associated with a Source.
 *
 * @memberof types
 * @static
 */
export type Breakpoint = {
  readonly disabled: boolean;
  readonly id: string;
  readonly location: StableLocation;
  readonly options: BreakpointOptions;
  readonly serverId?: string;
};

export type PrefixBadge = "blue" | "green" | "orange" | "purple" | "unicorn" | "yellow";

/**
 * Options for a breakpoint that can be modified by the user.
 */
export type BreakpointOptions = {
  hidden?: boolean;
  condition?: string | null;
  logValue?: string | null;
  logGroupId?: string | null;
  shouldPause?: boolean;
  prefixBadge?: PrefixBadge;
};

/**
 * XHR Breakpoint
 * @memberof types
 * @static
 */
export type XHRBreakpoint = {
  readonly path: string;
  readonly method: "GET" | "POST" | "DELETE" | "ANY";
  readonly loading: boolean;
  readonly disabled: boolean;
  readonly text: string;
};

/**
 * PendingBreakpoint
 *
 * @memberof types
 * @static
 */
export type PendingBreakpoint = {
  readonly location: PendingLocation;
  readonly astLocation: ASTLocation;
  readonly generatedLocation?: PendingLocation;
  readonly disabled: boolean;
  readonly text?: string;
  readonly options: BreakpointOptions;
};

/**
 * Frame ID
 *
 * @memberof types
 * @static
 */
export type FrameId = string;
type Expr = string;
export type XScopeVariable = {
  name: string;
  expr?: Expr;
};
export type XScopeVariables = {
  vars: XScopeVariable[];
  frameBase?: Expr | null;
};

/**
 * Frame
 * @memberof types
 * @static
 */
export type Frame = {
  id: FrameId;
  thread: string;
  displayName: string;
  location: SourceLocation;
  generatedLocation: SourceLocation;
  source: Source | null | undefined;
  scope?: Scope;
  // FIXME Define this type more clearly
  this: Record<string, any>;
  framework?: string;
  isOriginal?: boolean;
  originalDisplayName?: string;
  originalVariables?: XScopeVariables;
  library?: string;
  index: number;
  asyncCause: null | string;
  state: "on-stack" | "suspended" | "dead";
};
export type ChromeFrame = {
  id: FrameId;
  displayName: string;
  scopeChain: any;
  generatedLocation: SourceLocation;
  location: SourceLocation | null | undefined;
};
export type OriginalFrame = {
  displayName: string;
  variables?: Record<string, any>;
  location?: SourceLocation;
};

/**
 * ContextMenuItem
 *
 * @memberof types
 * @static
 */
export type ContextMenuItem = {
  id: string;
  label: string;
  accesskey: string;
  disabled: boolean;
  click: (...args: Array<any>) => any;
};

/**
 * why
 * @memberof types
 * @static
 */
export type ExceptionReason = {
  exception: string | Grip;
  message: string;
  type: "exception";
  frameFinished?: Record<string, any>;
};

/**
 * why
 * @memberof types
 * @static
 */
export type Why =
  | ExceptionReason
  | {
      type: string;
      message?: string;
      frameFinished?: Record<string, any>;
      nodeGrip?: Record<string, any>;
      ancestorGrip?: Record<string, any>;
      exception?: string;
      action?: string;
    };

/**
 * Why is the Debugger Paused?
 * This is the generic state handling the reason the debugger is paused.
 * Reasons are usually related to "breakpoint" or "debuggerStatement"
 * and should eventually be specified here as an enum.  For now we will
 * just offer it as a string.
 * @memberof types
 * @static
 */
export type WhyPaused = {
  type: string;
};
export type LoadedObject = {
  objectId: string;
  parentId: string;
  name: string;
  value: any;
};

/**
 * Pause
 * @memberof types
 * @static
 */
export type Pause = {
  thread: string;
  frame: Frame;
  frames: Frame[];
  why: Why;
  loadedObjects?: LoadedObject[];
};

/**
 * Expression
 * @memberof types
 * @static
 */
export type Expression = {
  input: string;
  value: Record<string, any>;
  from: string;
  updating: boolean;
  exception?: string;
  error?: string;
};

/**
 * PreviewGrip
 * @memberof types
 * @static
 */

/**
 * Grip
 * @memberof types
 * @static
 */
export type Grip = {
  class: string;
  extensible: boolean;
  frozen: boolean;
  isGlobal: boolean;
  ownPropertyLength: number;
  ownProperties: Record<string, any>;
  preview?: Grip;
  sealed: boolean;
  type: string;
  url?: string;
  fileName?: string;
  message?: string;
  name?: string;
};
export type TextSourceContent = {
  type: "text";
  value: string;
  contentType: string | void;
};
export type WasmSourceContent = {
  type: "wasm";
  value: {
    binary: Record<string, any>;
  };
};

/**
 * Source
 *
 * @memberof types
 * @static
 */
export type Source = {
  readonly id: SourceId;
  readonly url: URL;
  readonly isBlackBoxed: boolean;
  readonly isPrettyPrinted: boolean;
  readonly relativeUrl: URL;
  readonly extensionName: string | null | undefined;
  readonly isExtension: boolean;
  readonly isWasm: boolean;
  readonly isOriginal: boolean;
};

/**
 * Describes content of the binding.
 * FIXME Define these type more clearly
 */
export type BindingContents = {
  value: any;
};

/**
 * Defines map of binding name to its content.
 */
export type ScopeBindings = Record<string, BindingContents>;

/**
 * Scope
 * @memberof types
 * @static
 */
export type Scope = {
  parent: Scope | null | undefined;
  bindings?: {
    arguments: Array<ScopeBindings>;
    variables: ScopeBindings;
    this?: BindingContents | null;
  };
  object: Record<string, any> | null | undefined;
  function:
    | {
        class: string;
        displayName: string;
        location: SourceLocation;
        parameterNames: string[];
      }
    | null
    | undefined;
  type: string;
  scopeKind: string;
};
export type ThreadType = "mainThread" | "worker" | "contentProcess";
export type Thread = {
  readonly url: URL;
  readonly type: ThreadType;
  readonly name: string;
  serviceWorkerStatus?: string;
};
export type Worker = Thread;
export type ThreadList = Array<Thread>;
export type Cancellable = {
  cancel: () => void;
};
export type EventListenerBreakpoints = string[];
export type SourceDocuments = Record<string, Record<string, any>>;
export type BreakpointPosition = MappedLocation;
export type BreakpointPositions = Record<number, BreakpointPosition[]>;
export type DOMMutationBreakpoint = {
  id: number;
  nodeFront: Record<string, any>;
  mutationType: "subtree" | "attribute" | "removal";
  enabled: boolean;
};
export type Previews = {
  line: Array<Preview>;
};
export type HighlightedCall = CallDeclaration & {
  clear: Record<string, any>;
};
export type HighlightedCalls = Array<HighlightedCall>;
export type Preview = {
  name: string;
  value: any;
  column: number;
  line: number;
};
