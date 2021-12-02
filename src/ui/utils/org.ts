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

export function isPublicDisabled(workspaces: Workspace[], selectedWorkspaceId: string) {
  const workspace = workspaces.find(w => w.id === selectedWorkspaceId);
  const publicDisabledMyLibrary = workspaces.some(
    w => w.settings.features.recording.public === false
  );
  return (
    (selectedWorkspaceId === "My Library" && publicDisabledMyLibrary) ||
    workspace?.settings.features.recording.public === false
  );
}
