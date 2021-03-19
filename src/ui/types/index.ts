export interface User {
  name: string;
  email: string;
  picture: string;
  id: string;
  nickname: string;

  collaborators?: Collaborator[];
  recordings: Recording[];
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
  user?: User;
}

interface Collaborator {
  recording: Recording;
  user: User;
}
