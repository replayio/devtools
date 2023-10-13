import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

import { setLoadingFinished } from "ui/actions/app";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";
import Login from "ui/components/shared/Login/Login";
import { useAppDispatch } from "ui/setup/hooks";
import useAuth0 from "ui/utils/useAuth0";

export function Sidebar({ teamId }: { teamId: string }) {
  return (
    <nav className="flex w-64 flex-col space-y-4">
      <Link href={`/dashboard/${teamId}/test-runs`}>Runs</Link>
      <Link href={`/dashboard/${teamId}/errors`}>Errors</Link>
      <Link href={`/dashboard/${teamId}/tests`}>Tests</Link>
    </nav>
  );
}

export const MY_LIBRARY_TEAM = { name: "Your Library", isTest: false, id: "me", databaseId: null };

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth0();
  const teamParam = router.query.team;
  const teamId = Array.isArray(teamParam) ? teamParam[0] : teamParam;

  useEffect(() => {
    dispatch(setLoadingFinished(true));
  }, [dispatch]);

  if (!isAuthenticated) {
    return <Login returnToPath={window.location.pathname + window.location.search} />;
  }

  if (!teamId) {
    return <div>No team. Sorry :(</div>;
  }

  return (
    <TeamContext.Provider value={{ teamId, team: MY_LIBRARY_TEAM, isPendingTeam: false }}>
      <main className="flex h-full w-full flex-row">
        <Sidebar teamId={teamId} />
        <div className="flex flex-grow flex-row">{children}</div>
      </main>
    </TeamContext.Provider>
  );
}

export default function Dashboard() {
  return <DashboardLayout>Content</DashboardLayout>;
}
