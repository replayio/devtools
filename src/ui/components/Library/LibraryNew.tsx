import Navigation from "./Navigation";
import { TeamPage } from "./Team/TeamPage";

export const TEAMS = [
  { name: "glide", isTest: false },
  { name: "dynaboard", isTest: true },
  { name: "hasura", isTest: false },
];

export default function Library() {
  return (
    <div className="flex flex-row w-screen h-screen">
      <Navigation />
      <TeamPage />
    </div>
  );
}
