import React from "react";
import { Workspace } from "ui/types";
import NewTeamButton from "./NewTeamButton";
import SidebarFooter from "./SidebarFooter";
import TeamButton from "./TeamButton";

export default function Sidebar({ nonPendingWorkspaces }: { nonPendingWorkspaces: Workspace[] }) {
  const workspaces = [{ id: null, name: "Your Library", members: [] }, ...nonPendingWorkspaces];

  // TODO: Redact the team names
  return (
    <div className="flex flex-col bg-gray-800 text-gray-300 w-64">
      <div className="p-4">
        <img className="w-8 h-8" src="/images/logo.svg" />
      </div>
      <div className="flex flex-col flex-grow text-sm overflow-auto">
        {workspaces.map(w => (
          <TeamButton key={w.id} id={w.id} text={w.name} />
        ))}
        <NewTeamButton />
      </div>
      <SidebarFooter />
    </div>
  );
}
