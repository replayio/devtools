import { useRouter } from "next/router";
import { useEffect } from "react";
import hooks from "ui/hooks";
import { useGetTeamRouteParams } from "ui/utils/library";
import LoadingScreen from "../shared/LoadingScreen";
import Navigation from "./Navigation/Navigation";
import { TeamPage } from "./Team/TeamPage";

// This is a wrapper for useGetTeamRouteParams. In case the user does not specify a team,
// this hook initializes a team based on their default workspace.
const useGetTeamId = () => {
  const router = useRouter();
  const { teamId } = useGetTeamRouteParams();
  const { userSettings, loading: settingsLoading } = hooks.useGetUserSettings();

  useEffect(() => {
    if (settingsLoading) {
      return;
    }

    // If there's not already a teamId, initialize the teamId (based on the user's default team)
    // by pushing a new route.
    if (teamId === undefined) {
      const { defaultWorkspaceId } = userSettings;
      if (defaultWorkspaceId) {
        router.push(`/new-team/${defaultWorkspaceId}`);
      } else {
        router.push(`/new-team/me/recordings`);
      }
    }
  }, [settingsLoading, router, userSettings, teamId]);

  return teamId || null;
};

export default function Library() {
  const teamId = useGetTeamId();

  if (!teamId) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-row w-screen h-screen">
      <Navigation />
      <TeamPage />
    </div>
  );
}
