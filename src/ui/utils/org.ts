import { Workspace, WorkspaceSettings } from "shared/graphql/types";
import { useGetNonPendingWorkspaces } from "ui/hooks/workspaces";

import { useGetTeamIdFromRoute } from "../components/Library/Team/utils";

export function getDefaultOrganizationSettings(): WorkspaceSettings {
  return {
    features: {
      user: {
        library: true,
        autoJoin: null,
      },
      recording: {
        public: true,
        allowList: [],
        blockList: [],
      },
    },
  };
}

export function getOrganizationSettings(workspaces: Workspace[]) {
  const org = workspaces.find(w => w.isOrganization);
  return org?.settings || getDefaultOrganizationSettings();
}

export function useIsPublicEnabled() {
  const { workspaces, loading: loadingWorkspaces } = useGetNonPendingWorkspaces();
  const teamId = useGetTeamIdFromRoute();

  if (loadingWorkspaces) {
    return false;
  }

  return !isPublicDisabled(workspaces, teamId);
}

export function isPublicDisabled(workspaces: Workspace[], selectedWorkspaceId: string | null) {
  const workspace = workspaces.find(w => w.id === selectedWorkspaceId);
  const publicDisabledMyLibrary = workspaces.some(
    w => w.settings?.features.recording.public === false
  );
  return (
    (!selectedWorkspaceId && publicDisabledMyLibrary) ||
    workspace?.settings?.features.recording.public === false
  );
}
