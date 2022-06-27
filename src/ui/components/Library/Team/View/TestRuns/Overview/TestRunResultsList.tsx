import Link from "next/link";
import { ReactNode, useContext } from "react";
import { TeamContext } from "../../../TeamPage";

export function TestRunResultsList({ results }: { results: { title: string }[] }) {
  return (
    <div className="flex flex-col space-y-2 overflow-auto">
      {results.map((r, i) => (
        <ListItem key={i} index={i}>
          {r.title}
        </ListItem>
      ))}
    </div>
  );
}

function ListItem({ children, index }: { children: ReactNode; index: number }) {
  const { teamId } = useContext(TeamContext);

  return (
    <div className="flex flex-row p-4 space-x-2 bg-green-400">
      <Link href="">
        <a className="flex w-6 h-6 bg-green-600 rounded-full">
          <div className="m-auto text-green-300">►</div>
        </a>
      </Link>
      <Link href={`/new-team/${teamId}/results/${index}`}>
        <a className="overflow-hidden whitespace-pre hover:underline overflow-ellipsis">
          {children}
        </a>
      </Link>
    </div>
  );
}
