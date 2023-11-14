import orderBy from "lodash/orderBy";
import { Dispatch, SetStateAction, useState } from "react";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import { __EXECUTION } from "shared/test-suites/TestRun";

import styles from "../../../../Library.module.css";
import testPageStyles from "../TestsPage.module.css";

export function TestErrorList({
  errorFrequency,
  executions,
}: {
  errorFrequency: Record<string, number>;
  executions: __EXECUTION[];
}) {
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [filterByTime, setFilterByTime] = useState<number | null>(null);

  const {
    contextMenu: contextMenuTimeFilter,
    onContextMenu: onClickTimeFilter,
    onKeyDown: onKeyDownTimeFilter,
  } = useContextMenu(
    <>
      <ContextMenuItem dataTestId="show-all-runs" onSelect={() => setFilterByTime(null)}>
        All errors
      </ContextMenuItem>
    </>,
    { alignTo: "auto-target" }
  );

  const passing = executions.filter(e => e.result === "passed");
  const failing = executions.filter(e => e.result === "failed");
  const sortedFailing = orderBy(failing, "createdAt", "desc");
  const sortedPassing = orderBy(passing, "createdAt", "desc");

  return (
    <div>
      <div className="flex flex-col gap-2 border-b border-themeBorder py-2">
        <div className="flex items-center justify-between px-4">
          <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-medium">
            Top Errors
          </div>
          <div
            className={testPageStyles.dropdownTrigger}
            data-test-id="TestPage-BranchFilter-DropdownTrigger"
            onClick={onClickTimeFilter}
            onKeyDown={onKeyDownTimeFilter}
            tabIndex={0}
          >
            {filterByTime === null ? "All errors" : ""}
            <Icon className="h-5 w-5" type="chevron-down" />
          </div>
          {contextMenuTimeFilter}
        </div>
        <div>
          {Object.entries(errorFrequency)
            .slice(0, 5)
            .map(([msg, count], i) => (
              <ErrorListItem
                msg={msg}
                count={count}
                setSelectedError={setSelectedError}
                key={i}
                isSelected={msg === selectedError}
              />
            ))}
        </div>
      </div>
      {selectedError ? (
        <div className="flex flex-col gap-2 py-2 px-4">
          <div className="flex flex-col gap-1">
            <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-medium">
              Replay that contain this error
            </div>
            <div>
              {sortedFailing.slice(0, 3).map((e, i) => (
                <div key={i}>{e.createdAt}</div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-medium">
              Recent replays of the test passing
            </div>
            <div>
              {sortedPassing.slice(0, 3).map((e, i) => (
                <div key={i}>{e.createdAt}</div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ErrorListItem({
  msg,
  count,
  setSelectedError,
  isSelected,
}: {
  msg: string;
  count: number;
  setSelectedError: Dispatch<SetStateAction<string | null>>;
  isSelected: boolean;
}) {
  return (
    <div
      key={msg}
      title={msg}
      className={`flex cursor-pointer flex-row items-center space-x-3 rounded-sm bg-themeBase-100 p-3 ${
        styles.libraryRow
      } ${isSelected ? styles.libraryRowSelected : ""}
`}
      onClick={() => setSelectedError(msg)}
    >
      <div className="flex h-5 w-8 shrink-0 items-center justify-center rounded-md bg-[#F02D5E] text-xs font-bold text-chrome">
        {count}
      </div>
      <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">{msg}</div>
    </div>
  );
}
