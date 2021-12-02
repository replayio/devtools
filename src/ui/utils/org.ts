import { Workspace, WorkspaceSettings } from "ui/types";

export function getDefaultOrganizationSettings(): WorkspaceSettings {
  return {
    features: {
      user: {
        library: true,
      },
      recording: {
        public: true,
      },
    },
    motd: null,
  };
}

export function getOrganizationSettings(workspaces: Workspace[]) {
  const org = workspaces.find(w => w.isOrganization);
  return org?.settings || getDefaultOrganizationSettings();
}
