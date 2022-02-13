export interface User {
  name: string;
  picture: string;
  id: string;
  internal: boolean;
}

export type UserSettings = {
  apiKeys: ApiKey[];
  defaultWorkspaceId: null | string;
  disableLogRocket: boolean;
  enableEventLink: boolean;
  enableTeams: boolean;
  showReact: boolean;
};

export type LocalUserSettings = {
  enableCommentAttachments: boolean;
};

export type CombinedUserSettings = UserSettings & LocalUserSettings;

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
  | "org-annual-v1";

export interface Subscription {
  id: string;
  createdAt: string;
  seatCount: number;
  effectiveFrom?: string;
  effectiveUntil?: string;
  createdBy: User;
  status: WorkspaceSubscriptionStatus;
  trialEnds: string | null;
  plan: {
    id: string;
    name: string;
    key: PlanKey;
    createdAt: string;
  };
  paymentMethods: PaymentMethod[];
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
  url: string;
  title: string;
  duration: number;
  date: string;
  private: boolean;
  ownerNeedsInvite: boolean;
  user?: User;
  userId?: string;
  isInitialized: boolean;
  workspace?: Workspace;
  collaborators?: string[];
  comments?: any;
  userRole?: RecordingRole;
  operations: OperationsData;
  collaboratorRequests: CollaboratorRequest[];
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
  logo?: string;
  domain: string;
  hasPaymentMethod: boolean;
  id: string;
  invitationCode: string;
  isDomainLimitedCode: boolean;
  members?: User[];
  name: string;
  recordingCount?: number;
  settings: WorkspaceSettings;
  subscription?: Subscription;
  isOrganization: boolean;
}

export interface WorkspaceSettings {
  features: {
    user: {
      library: boolean;
      autoJoin: number | null;
    };
    recording: {
      public: boolean;
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
