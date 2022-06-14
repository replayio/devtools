import React, { useContext } from "react";
import { Test } from "ui/hooks/tests";
import { LibraryContext } from "../../useFilters";
import { ResultBar } from "./ResultBar";
import Badge from "../Badge";

export function TestRow({ test, onClick }: { test: Test; onClick: () => void }) {
  const { preview } = useContext(LibraryContext);
  const { path, recordings, date } = test;

  const displayedRecordings = test.recordings.filter(r => r.metadata?.test?.result).reverse();
  const longestDuration = Math.max(...test.recordings.map(r => r.duration));

  const isSelected = preview?.id.toString() === path.toString();

  // Todo: Have a separate treatment for the "timedOut" result.
  return (
    <div
      className={`} my-0.5 flex cursor-pointer flex-row items-center space-x-4 border-b border-themeBorder bg-white px-4 
        
      py-3`}
      style={{ backgroundColor: isSelected ? "#A3DEFA" : "" }}
      onClick={onClick}
    >
      <Badge recordings={recordings} />

      <div className="flex flex-col space-y-2">
        <div className="flex flex-row justify-between space-x-2">
          <div>{path[path.length - 1]}</div>
          <div className="flex items-center space-x-3 text-gray-500">
            <div className="flex flex-row items-center space-x-1">
              <div>{path?.[path.length - 2]}</div>
            </div>
          </div>
        </div>
        <div className="flex h-4 flex-row items-end space-x-0.5 overflow-hidden">
          {displayedRecordings.map((r, i) => (
            <ResultBar recording={r} key={i} maxDuration={longestDuration} />
          ))}
        </div>
      </div>
    </div>
  );
}
