import { motion } from "framer-motion";
import orderBy from "lodash/orderBy";
import { Dispatch, SetStateAction, useState } from "react";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import { __EXECUTION } from "shared/test-suites/TestRun";

import { getTruncatedRelativeDate } from "../../Recordings/RecordingListItem/RecordingListItem";
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

  const uniqueErrorCount = Object.entries(errorFrequency).length;
  const shouldTruncateErrors = Object.entries(errorFrequency).length > 5;

  return (
    <div>
      <div className="flex flex-col gap-2 border-b border-themeBorder py-2">
        <div className="flex items-center justify-between px-4">
          <div className="flex flex-row items-center gap-2 overflow-hidden">
            <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-medium">
              Top Errors
            </div>
            {shouldTruncateErrors ? (
              <div className="overflow-hidden overflow-ellipsis whitespace-nowrap ">
                (Showing 5 of {uniqueErrorCount} errors)
              </div>
            ) : null}
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
      {selectedError ? <ErrorReplays executions={executions} /> : null}
    </div>
  );
}

function ErrorReplays({ executions }: { executions: __EXECUTION }) {
  const passing = executions.filter(e => e.result === "passed");
  const failing = executions.filter(e => e.result === "failed");
  const sortedFailing = orderBy(failing, "createdAt", "desc");
  const sortedPassing = orderBy(passing, "createdAt", "desc");

  // TODO: show the processed/unprocessed status for the replays -jvv
  // TODO: add the top commit for the corresponding replay as label -jvv
  return (
    <div className="flex flex-col gap-2 py-2 px-4">
      <div className="flex flex-col gap-2">
        <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-medium">
          Replay that contain this error
        </div>
        <div className="flex flex-col gap-2">
          {sortedFailing.slice(0, 3).map((e, i) => (
            <div
              key={i}
              className="pointer-events-none flex flex-row justify-between  gap-2 opacity-50 "
            >
              <div className="flex items-center gap-2">
                <div className={styles.iconWrapper}>
                  <motion.div
                    className={styles.iconMotion}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 1.0, boxShadow: "0px 0px 1px rgba(0,0,0,0.2)" }}
                    transition={{ duration: 0.05 }}
                  >
                    <Icon className={styles["failed"]} type="play-unprocessed" />
                  </motion.div>
                </div>
                <div>{`Replay #${i + 1}`}</div>
              </div>
              <div>{getTruncatedRelativeDate(e.createdAt)}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-medium">
          Recent replays of the test passing
        </div>
        <div className="flex flex-col gap-2">
          {sortedPassing.slice(0, 3).map((e, i) => (
            <div
              key={i}
              className="pointer-events-none flex flex-row justify-between  gap-2 opacity-50"
            >
              <div className="flex items-center gap-2">
                <div className={styles.iconWrapper}>
                  <motion.div
                    className={styles.iconMotion}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 1.0, boxShadow: "0px 0px 1px rgba(0,0,0,0.2)" }}
                    transition={{ duration: 0.05 }}
                  >
                    <Icon className={styles["passed"]} type="play-unprocessed" />
                  </motion.div>
                </div>
                <div>{`Replay #${i + 1}`}</div>
              </div>
              <div>{getTruncatedRelativeDate(e.createdAt)}</div>
            </div>
          ))}
        </div>
      </div>
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
