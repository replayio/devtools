import { ExecutionPoint } from "@replayio/protocol";

export interface User {
  name?: string | null;
  picture?: string | null;
  id?: string;
  internal?: boolean;
}

export type ExperimentalUserSettings = {
  apiKeys: ApiKey[];
  defaultWorkspaceId: null | string;
  disableLogRocket: boolean;
  enableTeams: boolean;
  role: string;
};

export type LocalExperimentalUserSettings = {
  basicProcessingLoadingBar: boolean;
  disableScanDataCache: boolean;
  consoleFilterDrawerDefaultsToOpen: boolean;
  disableStableQueryCache: boolean;
  enableColumnBreakpoints: boolean;
  enableUnstableQueryCache: boolean;
  enableRoutines: boolean;
  rerunRoutines: boolean;
  profileWorkerThreads: boolean;
  brokenSourcemapWorkaround: boolean;
  trackRecordingAssetsInDatabase: boolean;
};

export type LocalUserSettings = LocalExperimentalUserSettings & {
  enableDarkMode: boolean;
};

export type CombinedExperimentalUserSettings = ExperimentalUserSettings &
  LocalExperimentalUserSettings;

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
  id: string;
  url?: string;
  title?: string | null;
  duration: number | null;
  date: string;
  private?: boolean;
  ownerNeedsInvite?: boolean;
  user?: User | null;
  userId?: string;
  isInitialized?: boolean;
  workspace?: Workspace;
  collaborators?: string[];
  comments?: any;
  userRole?: RecordingRole;
  operations?: OperationsData;
  resolution?: { resolvedAt: string; resolvedBy: string };
  collaboratorRequests?: CollaboratorRequest[] | null;
  metadata?: RecordingMetadata;
}

export interface RecordingMetadata {
  test?: TestMetadata;
  source?: SourceMetadata;
}

export type TestResult = "passed" | "failed" | "timedOut";

// https://github.com/Replayio/replay-cli/blob/main/packages/replay/metadata/test.ts
export type TestMetadata = {
  result: TestResult;
  title: string;
  version: number;
  tests?: TestItem[];
  run?: { id: string; title?: string };
  runner?: { name: string; version: string; plugin: string };
  path?: string[];
  file?: string;
};

export type TestItem = {
  title: string;
  relativePath?: string;
  result: TestResult;
  relativeStartTime?: number;
  duration?: number;
  steps?: TestStep[];
  id?: string;
  path?: string[];
  error?: TestItemError;
};

type TestItemError = {
  message: string;
  line?: number;
  column?: number;
};

type TestEvents = "test:start" | "step:end" | "step:enqueue" | "step:start" | "event:navigation";

export type CypressAnnotationMessage = {
  event: TestEvents;
  titlePath: string[];
  commandVariable?: "cmd" | "log";
  logVariable?: "cmd" | "log";
  id?: string;
  url?: string;
};
export interface Annotation {
  point: ExecutionPoint;
  time: number;
  message: CypressAnnotationMessage;
}

export type TestStep = {
  args?: any[];
  name: string;
  duration: number;
  relativeStartTime?: number;
  id: string;
  parentId?: string;
  alias?: string;
  error?: TestItemError;
  hook?: "beforeEach" | "afterEach";
};

export type AnnotatedTestStep = TestStep & {
  absoluteStartTime: number;
  absoluteEndTime: number;
  index: number;
  annotations: Annotations;
};

type Annotations = {
  start?: Annotation;
  end?: Annotation;
  enqueue?: Annotation;
};

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
