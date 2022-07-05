import { useRouter } from "next/router";
import { useEffect } from "react";
import hooks from "ui/hooks";
import { UserInfo } from "ui/hooks/users";
import { ExperimentalUserSettings } from "ui/types";
import { useGetTeamRouteParams, useRedirectToTeam } from "ui/components/Library/Team/utils";
import logrocket from "ui/utils/logrocket";
import useAuth0 from "ui/utils/useAuth0";
import LoadingScreen from "../shared/LoadingScreen";
import { LibraryNags } from "./LibraryNags";
import Navigation from "./Navigation/Navigation";
import { TeamPage } from "./Team/TeamPage";
import { MY_LIBRARY_TEAM } from "./Team/TeamContextRoot";
import { useUpdateDefaultWorkspace } from "ui/hooks/settings";

// This acts like a wrapper for useGetTeamRouteParams. In case the user does not specify a team,
// this hook initializes a team based on their default workspace.
const useGetTeamId = (defaultTeamId: string | null) => {
  const router = useRouter();
  const { teamId } = useGetTeamRouteParams();

  useEffect(() => {
    // If there's not already a teamId, initialize the teamId (based on the user's default team)
    // by pushing a new route.
    if (teamId === undefined) {
      if (defaultTeamId) {
        router.push(`/team/${defaultTeamId}`);
      } else {
        router.push(`/team/me/recordings`);
      }
    }
  }, [router, defaultTeamId, teamId]);

  return teamId || null;
};

function useGetIsValidTeamId(teamId: string | null) {
  const { workspaces, loading: loading1 } = hooks.useGetNonPendingWorkspaces();
  const { pendingWorkspaces, loading: loading2 } = hooks.useGetPendingWorkspaces();

  if (loading1 || loading2) {
    return null;
  }

  if (teamId === MY_LIBRARY_TEAM.id) {
    return true;
  }

  return !!(workspaces.find(w => w.id === teamId) || pendingWorkspaces?.find(w => w.id === teamId));
}

export default function LibraryLoader() {
  const { userSettings, loading: userSettingsLoading } = hooks.useGetUserSettings();
  const { loading: userInfoLoading, ...userInfo } = hooks.useGetUserInfo();

  if (userSettingsLoading || userInfoLoading) {
    return <LoadingScreen fallbackMessage="Reloading team details..." />;
  }

  return <Library userSettings={userSettings} userInfo={userInfo} />;
}

function Library({
  userSettings,
  userInfo,
}: {
  userSettings: ExperimentalUserSettings;
  userInfo: UserInfo;
}) {
  const teamId = useGetTeamId(userSettings.defaultWorkspaceId);
  const isValidTeamId = useGetIsValidTeamId(teamId);
  const updateDefaultWorkspace = useUpdateDefaultWorkspace();
  const redirectToTeam = useRedirectToTeam();
  const auth = useAuth0();

  useEffect(() => {
    logrocket.createSession({ userInfo, auth0User: auth.user, userSettings });
  }, [auth, userInfo, userSettings]);
  useEffect(() => {
    if (teamId && isValidTeamId === false) {
      redirectToTeam("me");
      updateDefaultWorkspace({ variables: { workspaceId: MY_LIBRARY_TEAM.databaseId } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, isValidTeamId, redirectToTeam]);

  if (!teamId) {
    return <LoadingScreen fallbackMessage="Loading team information..." />;
  }

  return (
    <div className="flex h-screen w-screen flex-row">
      <Navigation />
      <TeamPage />
      <LibraryNags />
    </div>
  );
}
