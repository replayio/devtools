import { Dispatch, SetStateAction, useState } from "react";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import LibraryDropdownTrigger from "ui/components/Library/LibraryDropdownTrigger";

import { ErrorFrequency } from "../hooks/useTest";
import { MAX_ERRORS_SHOWN } from "./TestDetails";
import styles from "../../../../Library.module.css";

export function TestErrors({
  errorFrequency,
  selectedError,
  setSelectedError,
}: {
  errorFrequency: Record<string, ErrorFrequency>;
  selectedError: string | null;
  setSelectedError: Dispatch<SetStateAction<string | null>>;
}) {
  const [filterByTime, setFilterByTime] = useState<number | null>(null);
  const uniqueErrorCount = Object.entries(errorFrequency).length;

  const {
    contextMenu: contextMenuTimeFilter,
    onContextMenu: onClickTimeFilter,
    onKeyDown: onKeyDownTimeFilter,
  } = useContextMenu(
    <>
      <ContextMenuItem disabled onSelect={() => setFilterByTime(1 / 24)}>
        Last hour
      </ContextMenuItem>
      <ContextMenuItem disabled onSelect={() => setFilterByTime(1)}>
        Last day
      </ContextMenuItem>
      <ContextMenuItem disabled onSelect={() => setFilterByTime(7)}>
        Last week
      </ContextMenuItem>
      <ContextMenuItem disabled onSelect={() => setFilterByTime(30)}>
        Last month
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => setFilterByTime(null)}>All time</ContextMenuItem>
    </>,
    { alignTo: "auto-target" }
  );
  return (
    <div className="flex flex-col gap-2 border-b border-themeBorder py-2">
      <div className="flex items-center justify-between px-4">
        <div className="flex flex-row items-center gap-2 overflow-hidden">
          <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-medium">
            Top Errors
          </div>
          {uniqueErrorCount > MAX_ERRORS_SHOWN ? (
            <div className="overflow-hidden overflow-ellipsis whitespace-nowrap ">
              (Showing {MAX_ERRORS_SHOWN} of {uniqueErrorCount} errors)
            </div>
          ) : null}
        </div>
        <LibraryDropdownTrigger
          onClick={onClickTimeFilter}
          onKeyDown={onKeyDownTimeFilter}
          label={filterByTime === null ? "All time" : ""}
        />
        {contextMenuTimeFilter}
      </div>
      <div>
        {Object.entries(errorFrequency)
          .slice(0, MAX_ERRORS_SHOWN)
          .map(([msg, { executions, replays }], i) => (
            <ErrorListItem
              msg={msg}
              executionCount={executions}
              replayCount={replays}
              setSelectedError={setSelectedError}
              key={i}
              isSelected={msg === selectedError}
            />
          ))}
      </div>
    </div>
  );
}
function ErrorListItem({
  msg,
  executionCount,
  replayCount,
  setSelectedError,
  isSelected,
}: {
  msg: string;
  executionCount: number;
  replayCount: number;
  setSelectedError: Dispatch<SetStateAction<string | null>>;
  isSelected: boolean;
}) {
  return (
    <div
      key={msg}
      title={msg}
      className={`flex cursor-pointer flex-row items-center justify-between space-x-3 rounded-sm bg-themeBase-100 p-3 ${
        styles.libraryRow
      } ${isSelected ? styles.libraryRowSelected : ""}
`}
      onClick={() => setSelectedError(msg)}
    >
      <div className="flex space-x-3 overflow-hidden ">
        <div className="flex h-5 w-8 shrink-0 items-center justify-center rounded-md bg-[#F02D5E] text-xs font-bold text-white">
          {executionCount}
        </div>
        <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">{msg}</div>
      </div>
      <div className="shrink-0 overflow-hidden overflow-ellipsis whitespace-nowrap opacity-50">
        ({replayCount})
      </div>
    </div>
  );
}
