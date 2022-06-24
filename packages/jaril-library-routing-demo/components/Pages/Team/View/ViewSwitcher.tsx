import Link from "next/link";
import { useContext } from "react";
import { TEAMS } from "../../../Library";
import { TeamContext } from "../TeamPage";
import { ViewContext } from "./ViewPage";

export function ViewSwitcher() {
  const { teamId } = useContext(TeamContext);
  const isTestTeam = TEAMS.find(t => t.name === teamId)?.isTest;

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
  const { teamId } = useContext(TeamContext);
  const { view: currentView } = useContext(ViewContext);
  const highlighted = currentView === view;

  return (
    <Link href={`/team/${teamId}/${view}`}>
      <a className={highlighted ? "font-bold" : ""}>{children}</a>
    </Link>
  );
}
