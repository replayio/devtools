import Link from "next/link";
import { useContext, useRef } from "react";
import { useGetTeamRouteParams } from "../../../../../src/utils";
import { TeamContext } from "../../TeamPage";

export function TestRunListItem({
  testRun,
}: {
  testRun: { title: string; author: string; id: string };
}) {
  const { title, author, id } = testRun;
  const { focusId } = useGetTeamRouteParams();
  const { teamId } = useContext(TeamContext);
  const highlighted = focusId === id;
  const linkNode = useRef<HTMLAnchorElement | null>(null);

  return (
    <Link href={`/team/${teamId}/runs/${id}`}>
      <a
        ref={linkNode}
        className={`flex flex-col p-4 ${highlighted ? "bg-sky-400" : "bg-sky-300"}`}
      >
        <div>{title}</div>
        <a className="text-sm hover:underline">{author}</a>
      </a>
    </Link>
  );
}
