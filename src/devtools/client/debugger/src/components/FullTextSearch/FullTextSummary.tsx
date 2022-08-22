import React from "react";

import type { FTSState } from "./index";

const numberFormat = new Intl.NumberFormat();

export function FullTextSummary({ results }: { results: FTSState["results"] }) {
  const { status, matchesBySource } = results;

  if (status !== "DONE") {
    return null;
  }

  const totalMatches = matchesBySource.reduce(
    (count, sourceMatch) => sourceMatch.matches.length + count,
    0
  );

  return (
    <div className="whitespace-pre pl-2">
      {numberFormat.format(totalMatches)} result{totalMatches === 1 ? "" : "s"}
    </div>
  );
}
