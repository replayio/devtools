import React, { useContext } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { Test } from "ui/hooks/tests";
import { getRelativeDate } from "../../RecordingRow";
import { LibraryContext } from "../../useFilters";
import { ResultBar } from "./ResultBar";

export function TestRow({ test, onClick }: { test: Test; onClick: () => void }) {
  const { preview } = useContext(LibraryContext);
  const { path, recordings, date } = test;

  const displayedRecordings = test.recordings.filter(r => r.metadata?.test?.result);
  const longestDuration = Math.max(...test.recordings.map(r => r.duration));

  const isSelected = preview?.id.toString() === path.toString();

  // Todo: Have a separate treatment for the "timedOut" result.
  return (
    <div
      className={`flex flex-col px-4 py-3 space-y-2 border-b cursor-pointer border-themeBorder ${
        isSelected ? "bg-blue-100" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col space-y-0.5">
        <div>
          {path[path.length - 1]} ({recordings.length})
        </div>
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          <div className="flex flex-row items-center space-x-1">
            <MaterialIcon>web_asset</MaterialIcon>
            <div>{path?.[1]}</div>
          </div>
          <div className="flex flex-row items-center space-x-1">
            <MaterialIcon>description</MaterialIcon>
            <div>{path?.[path.length - 2]}</div>
          </div>
          <div className="flex flex-row items-center space-x-1">
            <MaterialIcon>schedule</MaterialIcon>
            <div>Last run {getRelativeDate(date)}</div>
          </div>
        </div>
      </div>
      <div className="flex flex-row h-4 space-x-0.5 items-end">
        {displayedRecordings.map((r, i) => (
          <ResultBar recording={r} key={i} maxDuration={longestDuration} />
        ))}
      </div>
    </div>
  );
}
