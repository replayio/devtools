import Link from "next/link";
import { useRef } from "react";
import { useGetTeamRouteParams } from "../src/utils";
import { TestRunOverview } from "./TestRunOverview";

const MOCK_ARRAY = new Array(50).fill("").map((_, i) => i);

export function TestRunsPage() {
  const { focusId } = useGetTeamRouteParams();

  return (
    <div className="flex flex-row flex-grow">
      <div className="flex flex-col flex-grow p-4 space-y-2 overflow-auto bg-sky-200">
        {MOCK_ARRAY.map((_, i) => (
          <TestRunLink key={i} index={i} />
        ))}
      </div>
      {focusId ? <TestRunOverview /> : null}
    </div>
  );
}

function TestRunLink({ index }: { index: number }) {
  const { teamName, focusId } = useGetTeamRouteParams();
  const highlighted = focusId === String(index);
  const linkNode = useRef<HTMLAnchorElement | null>(null);

  return (
    <Link href={`/team/${teamName}/runs/${index}`}>
      <a ref={linkNode} className={`p-4 ${highlighted ? "bg-sky-400" : "bg-sky-300"}`}>
        Test Run {index}
      </a>
    </Link>
  );
}
