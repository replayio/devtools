import { useRouter } from "next/router";
import { useEffect } from "react";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import { UserSettings } from "shared/graphql/types";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";
import {
  pushRoute,
  useGetTeamRouteParams,
  useRedirectToTeam,
} from "ui/components/Library/Team/utils";
import hooks from "ui/hooks";
import { useUpdateDefaultWorkspace } from "ui/hooks/settings";
import { UserInfo } from "ui/hooks/users";
import logrocket from "ui/utils/logrocket";
import useAuth0 from "ui/utils/useAuth0";

import { LibraryNags } from "./LibraryNags";
import Navigation from "./Navigation/Navigation";
import { MY_LIBRARY_TEAM } from "./Team/TeamContextRoot";
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
        pushRoute(router, `/team/${defaultTeamId}`);
      } else {
        pushRoute(router, `/team/me/recordings`);
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
  const { loading: userSettingsLoading, userSettings } = hooks.useGetUserSettings();
  const userInfo = hooks.useGetUserInfo();

  if (userSettingsLoading || userInfo.loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LibrarySpinner />
      </div>
    );
  }

  return <Library userSettings={userSettings} userInfo={userInfo} />;
}

function Library({ userSettings, userInfo }: { userSettings: UserSettings; userInfo: UserInfo }) {
  const teamId = useGetTeamId(userSettings.defaultWorkspaceId);
  const isValidTeamId = useGetIsValidTeamId(teamId);
  const updateDefaultWorkspace = useUpdateDefaultWorkspace();
  const redirectToTeam = useRedirectToTeam();
  const auth = useAuth0();

  useEffect(() => {
    logrocket.createSession({ userInfo, auth0User: auth.user });
  }, [auth, userInfo]);

  useEffect(() => {
    if (teamId && isValidTeamId === false && MY_LIBRARY_TEAM.databaseId !== null) {
      redirectToTeam("me");
      updateDefaultWorkspace({ variables: { workspaceId: MY_LIBRARY_TEAM.databaseId } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, isValidTeamId, redirectToTeam]);

  if (!teamId) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LibrarySpinner />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-row">
      <Navigation />
      <InlineErrorBoundary key={teamId} name="Library">
        <TeamPage />
      </InlineErrorBoundary>
      <LibraryNags />
    </div>
  );
}
