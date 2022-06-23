import Link from "next/link";
import { ReactNode } from "react";
import { useGetTeamRouteParams } from "../src/utils";

const MOCK_ARRAY = new Array(50).fill("").map((_, i) => i);

export function TestRunOverview() {
  const { focusId } = useGetTeamRouteParams();

  return (
    <div className="flex flex-col w-1/3 p-4 space-y-4 bg-sky-300">
      <div>Test Run {focusId}</div>
      <TestRunResults />
    </div>
  );
}

function TestRunResults() {
  return (
    <div className="flex flex-col space-y-2 overflow-auto">
      {MOCK_ARRAY.map((r, i) => (
        <TestRunResult key={i} index={i}>
          {r}
        </TestRunResult>
      ))}
    </div>
  );
}

function TestRunResult({ children, index }: { children: ReactNode; index: number }) {
  const { teamName } = useGetTeamRouteParams();

  return (
    <div className="flex flex-row p-4 space-x-2 bg-green-400">
      <Link href="">
        <a className="flex w-6 h-6 bg-green-600 rounded-full">
          <div className="m-auto text-green-300">►</div>
        </a>
      </Link>
      <Link href={`/team/${teamName}/results/${index}`}>
        <a className="hover:underline">Test Result {children}</a>
      </Link>
    </div>
  );
}
