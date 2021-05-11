export interface User {
  name: string;
  picture: string;
  id: string;
  internal: boolean;
}

export interface UserSettings {
  showElements: boolean;
  showReact: boolean;
  enableTeams: boolean;
  enableRepaint: boolean;
  defaultWorkspaceId: null | string;
}

export interface Recording {
  id: string;
  url: string;
  title: string;
  duration: number;
  date: string;
  private: boolean;
  user?: User;
  userId?: string;
  isInitialized: boolean;
  workspace?: Workspace;
}

export interface Workspace {
  name: string;
  id: string;
  members?: User[];
}

export interface WorkspaceUser {
  membershipId: string;
  pending: boolean;
  invitedEmail?: string;
  user?: User;
  userId?: string;
}
