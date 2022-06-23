import Link from "next/link";
import { useGetTeamRouteParams } from "../src/utils";
import { TEAMS } from "./Library";

export function ViewSwitcher() {
  const { teamName } = useGetTeamRouteParams();
  const isTestTeam = TEAMS.find(t => t.name === teamName)?.isTest;

  if (!isTestTeam) {
    return null;
  }

  return (
    <div className="flex p-4 space-x-2 bg-orange-200">
      <View view="recordings">Replays</View>
      <View view="runs">Test Runs</View>
      <View view="results">Test Results</View>
    </div>
  );
}

function View({ children, view }: { children: string; view: string }) {
  const { teamName, view: currentView } = useGetTeamRouteParams();
  const highlighted = currentView === view;

  return (
    <Link href={`/team/${teamName}/${view}`}>
      <a className={highlighted ? "font-bold" : ""}>{children}</a>
    </Link>
  );
}
