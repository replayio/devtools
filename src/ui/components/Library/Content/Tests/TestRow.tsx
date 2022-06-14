import React, { useContext } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { Test } from "ui/hooks/tests";
import { LibraryContext } from "../../useFilters";
import { ResultBar } from "./ResultBar";

export function TestRow({ test, onClick }: { test: Test; onClick: () => void }) {
  const { preview } = useContext(LibraryContext);
  const { path, recordings, date } = test;

  const displayedRecordings = test.recordings.filter(r => r.metadata?.test?.result).reverse();
  const longestDuration = Math.max(...test.recordings.map(r => r.duration));

  const isSelected = preview?.id.toString() === path.toString();
  const failCount = recordings.filter(r => r.metadata.test?.result !== "passed").length;

  // Todo: Have a separate treatment for the "timedOut" result.
  return (
    <div
      className={`flex flex-row px-4 py-3 space-x-4 border-b cursor-pointer border-themeBorder items-center ${
        isSelected ? "bg-blue-100" : ""
      }`}
      onClick={onClick}
    >
      <div className="grid items-center justify-center w-8 h-8 font-medium text-red-700 bg-gray-300 rounded-md">
        {failCount}
      </div>
      <div className="flex flex-col space-y-2">
        <div className="flex flex-row justify-between space-x-2">
          <div>{path[path.length - 1]}</div>
          <div className="flex items-center space-x-3 text-gray-500">
            <div className="flex flex-row items-center space-x-1">
              <div>{path?.[path.length - 2]}</div>
            </div>
          </div>
        </div>
        <div className="flex flex-row h-4 space-x-0.5 items-end overflow-hidden">
          {displayedRecordings.map((r, i) => (
            <ResultBar recording={r} key={i} maxDuration={longestDuration} />
          ))}
        </div>
      </div>
    </div>
  );
}
