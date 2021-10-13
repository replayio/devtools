export interface User {
  name: string;
  picture: string;
  id: string;
  internal: boolean;
}

export type UserSettings = {
  apiKeys: ApiKey[];
  showElements: boolean;
  showReact: boolean;
  enableTeams: boolean;
  enableRepaint: boolean;
  enableGlobalSearch: boolean;
  defaultWorkspaceId: null | string;
  disableLogRocket: boolean;
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
    key: string;
    createdAt: string;
  };
  paymentMethods: PaymentMethod[];
}

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
}

export interface PendingWorkspaceInvitation extends Workspace {
  inviterEmail: string | null;
}

export interface Workspace {
  name: string;
  id: string;
  invitationCode: string;
  domain: string;
  isDomainLimitedCode: boolean;
  recordingCount?: number;
  members?: User[];
  apiKeys?: ApiKey[];
  subscription?: Subscription;
  hasPaymentMethod: boolean;
}

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
