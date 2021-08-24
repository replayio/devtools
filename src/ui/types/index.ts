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
  defaultWorkspaceId: null | string;
};

export type ApiKeyScope = "admin:all" | "write:sourcemap";

export interface ApiKey {
  id: string;
  createdAt: string;
  label: string;
  scopes: ApiKeyScope[];
}

export interface ApiKeyResponse {
  key: ApiKey;
  keyValue: string;
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
