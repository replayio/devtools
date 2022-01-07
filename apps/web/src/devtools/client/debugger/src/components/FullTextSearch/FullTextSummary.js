import React from "react";

export function FullTextSummary({ results }) {
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
      {new Intl.NumberFormat().format(totalMatches)} result{totalMatches === 1 ? "" : "s"}
    </div>
  );
}
