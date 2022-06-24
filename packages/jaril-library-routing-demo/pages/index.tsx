import { useRouter } from "next/router";
import { useEffect } from "react";
import { TEAMS } from "../components/Library";

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    const firstTeamUrl = `/team/${TEAMS[0].name}/${TEAMS[0].isTest ? "runs" : "recordings"}`;
    // const personalLibraryUrl = `/team/me/recordings"`;

    router.push(firstTeamUrl);
  });

  return null;
}
