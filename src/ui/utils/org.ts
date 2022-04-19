import { useSelector } from "react-redux";
import { useGetNonPendingWorkspaces } from "ui/hooks/workspaces";
import { getWorkspaceId } from "ui/reducers/app";
import { Workspace, WorkspaceSettings } from "ui/types";

export function getDefaultOrganizationSettings(): WorkspaceSettings {
  return {
    features: {
      recording: {
        public: true,
      },
      user: {
        autoJoin: null,
        library: true,
      },
    },
    motd: null,
  };
}

export function getOrganizationSettings(workspaces: Workspace[]) {
  const org = workspaces.find(w => w.isOrganization);
  return org?.settings || getDefaultOrganizationSettings();
}

export function useIsPublicEnabled() {
  const { workspaces, loading: loadingWorkspaces } = useGetNonPendingWorkspaces();
  const currentWorkspaceId = useSelector(getWorkspaceId);

  if (loadingWorkspaces) {
    return false;
  }

  return !isPublicDisabled(workspaces, currentWorkspaceId);
}

export function isPublicDisabled(workspaces: Workspace[], selectedWorkspaceId: string | null) {
  const workspace = workspaces.find(w => w.id === selectedWorkspaceId);
  const publicDisabledMyLibrary = workspaces.some(
    w => w.settings.features.recording.public === false
  );
  return (
    (!selectedWorkspaceId && publicDisabledMyLibrary) ||
    workspace?.settings.features.recording.public === false
  );
}
