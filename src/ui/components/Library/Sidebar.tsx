import React from "react";
import { useGetUserInfo } from "ui/hooks/users";
import { Workspace } from "ui/types";
import Invitations from "./Invitations";
import NewTeamButton from "./NewTeamButton";
import SidebarFooter from "./SidebarFooter";
import TeamButton from "./TeamButton";

export default function Sidebar({ nonPendingWorkspaces }: { nonPendingWorkspaces: Workspace[] }) {
  const { features } = useGetUserInfo();
  const userLibrary = { id: null, name: "Your Library", members: [] };

  // This corresponds with tailwind colors: thumb is gray-500 and track is gray-800
  const scrollbarStyle = { scrollbarColor: "#6B7280 #1F2937" };

  return (
    <div className="flex w-64 flex-shrink-0 flex-col bg-gray-800 text-gray-300">
      <div className="p-4">
        <img className="h-8 w-8" src="/images/logo.svg" />
      </div>
      <div
        className="library-sidebar flex flex-grow flex-col overflow-auto text-sm"
        style={scrollbarStyle}
      >
        {features.library ? (
          <TeamButton key={userLibrary.id} id={userLibrary.id} text={userLibrary.name} />
        ) : null}
        <Invitations />
        {nonPendingWorkspaces.map(w => (
          <TeamButton key={w.id} id={w.id} text={w.name} workspace={w} />
        ))}
        <NewTeamButton />
      </div>
      <SidebarFooter />
    </div>
  );
}
