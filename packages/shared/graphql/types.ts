import { ExecutionPoint } from "@replayio/protocol";

import { AnyGroupedTestCases } from "shared/test-suites/RecordingTestMetadata";

export enum Nag {
  ADD_COMMENT = "add_comment",
  ADD_COMMENT_TO_LINE = "add_comment_to_line",
  ADD_COMMENT_TO_NETWORK_REQUEST = "add_comment_to_network_request",
  ADD_COMMENT_TO_PRINT_STATEMENT = "add_comment_to_print_statement",
  ADD_UNICORN_BADGE = "add_unicorn_badge",
  DISMISS_TOUR = "dismiss_tour",
  DOWNLOAD_REPLAY = "download_replay",
  EXPLORE_SOURCES = "explore_sources",
  FIND_FILE = "find_file",
  FIRST_BREAKPOINT_ADD = "first_breakpoint_add",
  FIRST_BREAKPOINT_EDIT = "first_breakpoint_edit",
  FIRST_BREAKPOINT_SAVE = "first_breakpoint_save",
  FIRST_CONSOLE_NAVIGATE = "first_console_navigate",
  FIRST_LOG_IN = "first_log_in",
  FIRST_REPLAY_2 = "first_replay_2",
  INSPECT_COMPONENT = "inspect_component",
  INSPECT_ELEMENT = "inspect_element",
  INSPECT_NETWORK_REQUEST = "inspect_network_request",
  JUMP_TO_CODE = "jump_to_code",
  JUMP_TO_EVENT = "jump_to_event",
  JUMP_TO_NETWORK_REQUEST = "jump_to_network_request",
  LAUNCH_COMMAND_PALETTE = "launch_command_palette",
  QUICK_OPEN_FILE = "quick_open_file",
  RECORD_REPLAY = "record_replay",
  SEARCH_SOURCE_TEXT = "search_source_text",
  SHARE = "share",
  USE_FOCUS_MODE = "use_focus_mode",
  VIEW_DEVTOOLS = "view_devtools",
}

export enum EmailSubscription {
  COLLABORATOR_REQUEST = "collaborator_request",
  REPLAY_COMMENT = "replay_comment",
  NEW_TEAM_INVITE = "new_team_invite",
}

export interface User {
  id: string;
  internal?: boolean;
  name?: string | null;
  picture?: string | null;
}

export type UserInfo = {
  motd: string | null;
  acceptedTOSVersion: number | null;
  name: string | null;
  picture: string | null;
  email: string;
  id: string;
  internal: boolean;
  nags: Nag[];
  unsubscribedEmailTypes: EmailSubscription[];
  features: { library: boolean };
};

export interface CommentSourceLocation {
  sourceUrl: string;
  line: number;
  column: number;
  sourceId: string;
}

// TODO Keep in sync with e2e-tests/helpers/comments
export type CommentType = "source-code" | "network-request" | "visual";

interface Remark {
  content: string;
  createdAt: string;
  hasFrames: boolean;
  id: string;
  isPublished: boolean;
  point: string;
  sourceLocation: CommentSourceLocation | null;
  time: number;
  updatedAt: string;
  user: User;
}

export interface CommentPosition {
  x: number;
  y: number;
}

export interface Comment extends Remark {
  replies: Reply[];
  type: string | null;
  typeData: any | null;
}

export interface Reply extends Remark {
  parentId: string;
}

// Copied from src/ui/types/index

export type UserSettings = {
  apiKeys: ApiKey[];
  defaultWorkspaceId: null | string;
};

export type ApiKeyScope = "admin:all" | "write:sourcemap";

export interface ApiKey {
  id: string;
  createdAt: string;
  label: string;
  scopes: ApiKeyScope[];
  recordingCount: number;
  maxRecordings: number | null;
}

export interface ApiKeyResponse {
  key: ApiKey;
  keyValue: string;
}

export enum WorkspaceSubscriptionStatus {
  // Subscription is active and payment is up to date
  Active = "active",
  // Subscription is active but a billing problem must be resolved
  Incomplete = "incomplete",
  // Subscription is active under a trial
  Trial = "trialing",
  // Subscription has been cancelled either by the user or by system due to unpayment
  Canceled = "canceled",
}

export interface PaymentMethod {
  id: string;
  default: boolean;
  type: "card";
  card: {
    brand: string;
    last4: string;
  };
}

type PlanKey =
  | "org-v1"
  | "team-v1"
  | "test-team-v1"
  | "beta-v1"
  | "test-beta-v1"
  | "ent-v1"
  | "team-annual-v1"
  | "org-annual-v1"
  | "org-annual-contract-v1"
  | "team-oss-v1"
  | "team-internal-v1";

export interface Subscription {
  id?: string;
  createdAt?: string;
  seatCount?: number;
  effectiveFrom?: string;
  effectiveUntil?: string;
  createdBy?: User;
  status: WorkspaceSubscriptionStatus | null;
  trialEnds?: string | null;
  plan?: {
    id?: string;
    name?: string;
    key: PlanKey;
    createdAt?: string;
  } | null;
  paymentMethods?: PaymentMethod[];
}

export type BillingSchedule = "annual" | "monthly" | "contract";

export interface PlanPricing {
  billingSchedule: BillingSchedule | null;
  displayName: string;
  seatPrice: number;
  trial: boolean;
  discount: number;
}

export interface SubscriptionWithPricing extends Subscription, PlanPricing {}

export enum RecordingRole {
  // A user accessing a public recording may have no role (even if authenticated)
  None = "none",
  // The creator of the recording that exists in their library
  Owner = "owner",
  // A user invited to collaborate on recording
  Collaborator = "collaborator",
  // A user with access to the recording via their team with the "user" role on that team
  TeamUser = "team-user",
  // A user with access to the recording via their team with the "developer" role on that team
  TeamDeveloper = "team-developer",
  // A user with access to the recording via their team with the "admin" role on that team
  TeamAdmin = "team-admin",
}

export interface Recording {
  collaborators?: string[];
  collaboratorRequests?: CollaboratorRequest[] | null;
  comments?: any;
  date: string;
  duration: number | null;
  id: string;
  isInitialized?: boolean;
  isProcessed?: boolean;
  isTest?: boolean;
  isInTestWorkspace?: boolean;
  metadata?: RecordingMetadata | null;
  operations?: OperationsData;
  ownerNeedsInvite?: boolean;
  private?: boolean;
  resolution?: { resolvedAt: string; resolvedBy: string };
  title?: string | null;
  url?: string;
  user?: User | null;
  userId?: string;
  userRole?: RecordingRole;
  workspace?: Workspace;
  testRunId: string | null;
}

export type PlaywrightTestSources = {
  [fileName: string]: string;
};

export type PlaywrightTestStacks = {
  [id: string]: {
    file: string;
    line: number;
    column: number;
    functionName?: string;
  }[];
};

export interface RecordingMetadata {
  test?: AnyGroupedTestCases;
  source?: SourceMetadata;

  "x-replay-playwright"?: {
    sources: PlaywrightTestSources;
    stacks: PlaywrightTestStacks;
  };
}

export type TestResult = "passed" | "failed" | "timedOut" | "skipped" | "unknown";

type TestEvents =
  | "event:navigation"
  | "step:end"
  | "step:enqueue"
  | "step:start"
  | "test:end"
  | "test:start";

export type CypressAnnotationMessage = {
  event: TestEvents;
  titlePath: string[];
  commandVariable?: "cmd" | "log";
  logVariable?: "cmd" | "log";
  id?: string;
  url?: string;
  testId: number | null;
  attempt: number;
};
export interface Annotation {
  point: ExecutionPoint;
  time: number;
  message: CypressAnnotationMessage;
}

// https://github.com/Replayio/replay-cli/blob/main/packages/replay/metadata/source.ts

export type SourceMetadata = {
  result: "passed" | "failed";
  branch?: string;
  commit: SourceCommit;
  merge?: {
    id: string;
    title: string;
    url?: string;
  };
  trigger?: {
    name: string;
    user?: string;
    workflow?: string;
    url?: string;
  };
  provider?: string;
  repository?: string;
};

export type SourceCommit = {
  id: string;
  title?: string;
  url?: string;
};

export interface RecordingOptions {
  resolvedAt: string | null;
}

export interface CollaboratorRequest {
  user: User;
  id: string;
}

export interface OperationsData {
  scriptDomains: string[];
  cookies?: string[];
  storage?: string[];
}

export interface PendingWorkspaceInvitation extends Workspace {
  inviterEmail: string | null;
}

export interface Workspace {
  apiKeys?: ApiKey[];
  logo?: string | null;
  logoFormat?: string | null;
  domain?: string | null;
  hasPaymentMethod?: boolean;
  id: string;
  invitationCode?: string | null;
  isDomainLimitedCode?: boolean | null;
  members?: User[];
  name?: string;
  recordingCount?: number;
  settings?: WorkspaceSettings | null;
  subscription?: Subscription | null;
  isOrganization?: boolean;
  isTest?: boolean;
  retentionLimit?: number | null;
}

export interface WorkspaceSettings {
  features: {
    user: {
      library: boolean;
      autoJoin: number | null;
    };
    recording: {
      public: boolean;
      allowList: string[] | null;
      blockList: string[] | null;
    };
  };
  motd: string | null;
}

// https://typeofnan.dev/creating-your-own-deeppartial-type-in-typescript/
type DeepPartial<T> = Partial<{ [P in keyof T]: DeepPartial<T[P]> }>;

export type PartialWorkspaceSettingsFeatures = DeepPartial<WorkspaceSettings["features"]>;

export type WorkspaceUserRole = "viewer" | "debugger" | "admin";

export interface WorkspaceUser {
  membershipId: string;
  pending: boolean;
  email?: string;
  user?: User;
  userId?: string;
  createdAt?: string;
  roles?: WorkspaceUserRole[];
}
