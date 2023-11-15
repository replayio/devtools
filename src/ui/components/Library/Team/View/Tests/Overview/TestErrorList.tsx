import { motion } from "framer-motion";
import orderBy from "lodash/orderBy";
import { Dispatch, SetStateAction, useState } from "react";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import { TestExecution } from "shared/test-suites/TestRun";
import LibraryDropdownTrigger from "ui/components/Library/LibraryDropdownTrigger";

import { getTruncatedRelativeDate } from "../../Recordings/RecordingListItem/RecordingListItem";
import styles from "../../../../Library.module.css";

const MAX_ERRORS_SHOWN = 5;
const MAX_REPLAYS_SHOWN = 3;

export function TestErrorList({
  errorFrequency,
  executions,
}: {
  errorFrequency: Record<string, number>;
  executions: TestExecution[];
}) {
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [filterByTime, setFilterByTime] = useState<number | null>(null);

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

  const uniqueErrorCount = Object.entries(errorFrequency).length;

  return (
    <div>
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
      <div className="flex h-5 w-8 shrink-0 items-center justify-center rounded-md bg-[#F02D5E] text-xs font-bold text-white">
        {count}
      </div>
      <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">{msg}</div>
    </div>
  );
}

function ErrorReplays({ executions }: { executions: TestExecution[] }) {
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
          Recent replays that contain this error
        </div>
        <div className="flex flex-col gap-2">
          {sortedFailing.slice(0, MAX_REPLAYS_SHOWN).map((e, i) => (
            <ErrorReplayList date={e.createdAt} index={i + 1} key={i} status="failed" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-medium">
          Recent replays of the test passing
        </div>
        <div className="flex flex-col gap-2">
          {sortedPassing.slice(0, MAX_REPLAYS_SHOWN).map((e, i) => (
            <ErrorReplayList date={e.createdAt} index={i + 1} key={i} status="passed" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorReplayList({
  date,
  index,
  status,
}: {
  date: string;
  index: number;
  status: "passed" | "failed";
}) {
  return (
    <div className="pointer-events-none flex flex-row justify-between gap-2 opacity-50 ">
      <div className="flex items-center gap-2">
        <div className={styles.iconWrapper}>
          <motion.div
            className={styles.iconMotion}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 1.0, boxShadow: "0px 0px 1px rgba(0,0,0,0.2)" }}
            transition={{ duration: 0.05 }}
          >
            <Icon className={styles[status]} type="play-unprocessed" />
          </motion.div>
        </div>
        <div>{`Replay #${index}`}</div>
      </div>
      <div>{getTruncatedRelativeDate(date)}</div>
    </div>
  );
}
