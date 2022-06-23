import { useRouter } from "next/router";
import { useEffect } from "react";
import hooks from "ui/hooks";
import { UserInfo } from "ui/hooks/users";
import { ExperimentalUserSettings } from "ui/types";
import { useGetTeamRouteParams } from "ui/utils/library";
import logrocket from "ui/utils/logrocket";
import useAuth0 from "ui/utils/useAuth0";
import LoadingScreen from "../shared/LoadingScreen";
import { LibraryNags } from "./LibraryNags";
import Navigation from "./Navigation/Navigation";
import { TeamPage } from "./Team/TeamPage";

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
        router.push(`/new-team/${defaultTeamId}`);
      } else {
        router.push(`/new-team/me/recordings`);
      }
    }
  }, [router, defaultTeamId, teamId]);

  return teamId || null;
};

export default function LibraryLoader() {
  const { userSettings, loading: userSettingsLoading } = hooks.useGetUserSettings();
  const { loading: userInfoLoading, ...userInfo } = hooks.useGetUserInfo();

  if (userSettingsLoading || userInfoLoading) {
    return <LoadingScreen />;
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
  const auth = useAuth0();

  useEffect(() => {
    logrocket.createSession({ userInfo, auth0User: auth.user, userSettings });
  }, [auth, userInfo, userSettings]);

  if (!teamId) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-row w-screen h-screen">
      <Navigation />
      <TeamPage />
      <LibraryNags />
    </div>
  );
}
