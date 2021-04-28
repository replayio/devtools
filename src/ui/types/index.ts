import { Comment } from "ui/state/comments";

export interface User {
  name: string;
  email: string;
  picture: string;
  id: string;
  nickname: string;
  collaborators?: Collaborator[];
  recordings?: Recording[];
}

export interface Recording {
  id: string;
  url: string;
  title: string;
  recording_id: string;
  recordingTitle: string;
  last_screen_mime_type: string;
  duration: number;
  description: string;
  date: string;
  is_private: boolean;
  user_id: string;
  user?: User;
  collaborators?: Collaborator[];
  comments?: Comment[];
}

interface Collaborator {
  recording: Recording;
  user: User;
  user_id: string;
}

export interface Workspace {
  name: string;
  id: string;
  workspaces_users: WorkspaceUser[];
}

export interface WorkspaceUser {
  user: User;
  workspace_id: string;
  user_id: string;
  pending: boolean;
  workspace: {
    name: string;
  };
}
