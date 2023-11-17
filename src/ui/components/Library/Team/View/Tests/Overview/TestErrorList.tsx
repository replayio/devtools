import { RecordingId } from "@replayio/protocol";
import { motion } from "framer-motion";
import orderBy from "lodash/orderBy";
import { Dispatch, SetStateAction, useState } from "react";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import { TestExecution } from "shared/test-suites/TestRun";
import LibraryDropdownTrigger from "ui/components/Library/LibraryDropdownTrigger";

import { getTruncatedRelativeDate } from "../../Recordings/RecordingListItem/RecordingListItem";
import { ErrorFrequency } from "../hooks/useTest";
import styles from "../../../../Library.module.css";

const MAX_ERRORS_SHOWN = 5;
const MAX_REPLAYS_SHOWN = 3;

export function TestErrorList({
  errorFrequency,
  executions,
}: {
  errorFrequency: Record<string, ErrorFrequency>;
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
      {selectedError ? (
        <ErrorReplays
          executions={executions.filter(
            e => e.errors?.[0] === selectedError || e.result === "passed"
          )}
        />
      ) : null}
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

function ErrorReplays({ executions }: { executions: TestExecution[] }) {
  const passingReplays = executions.filter(e => e.result === "passed" && e.recordings.length);
  const failingReplays = executions.filter(e => e.result === "failed" && e.recordings.length);
  const sortedPassing = orderBy(passingReplays, "createdAt", "desc");
  const sortedFailing = orderBy(failingReplays, "createdAt", "desc");

  return (
    <div className="flex flex-col gap-2 py-2 px-4">
      {failingReplays.length ? (
        <div className="flex flex-col gap-2">
          <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-medium">
            Recent replays that contain this error
          </div>
          <div className="flex flex-col gap-2">
            {sortedFailing.slice(0, MAX_REPLAYS_SHOWN).map((e, i) => (
              <ErrorReplayListItem
                recordingId={e.recordings[0]!.id}
                recordingTitle={e.recordings[0]!.title}
                commitTitle={e.commitTitle}
                date={e.createdAt}
                key={i}
                status="failed"
              />
            ))}
          </div>
        </div>
      ) : null}
      {passingReplays.length ? (
        <div className="flex flex-col gap-2">
          <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-medium">
            Recent replays of the test passing
          </div>
          <div className="flex flex-col gap-2">
            {sortedPassing.slice(0, MAX_REPLAYS_SHOWN).map((e, i) => (
              <ErrorReplayListItem
                recordingId={e.recordings[0]!.id}
                recordingTitle={e.recordings[0]!.title}
                commitTitle={e.commitTitle}
                date={e.createdAt}
                key={i}
                status="passed"
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ErrorReplayListItem({
  recordingId,
  commitTitle,
  recordingTitle,
  date,
  status,
}: {
  recordingId: RecordingId;
  commitTitle: string | null;
  recordingTitle?: string | null;
  date: string;
  status: "passed" | "failed";
}) {
  const displayedTitle = commitTitle || recordingTitle || "(commit title missing)";

  return (
    <a
      href={`/recording/${recordingId}`}
      className="flex cursor-pointer flex-row justify-between gap-2"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <div className={styles.iconWrapper}>
          <motion.div
            className={styles.iconMotion}
            whileTap={{ scale: 1.0, boxShadow: "0px 0px 1px rgba(0,0,0,0.2)" }}
            transition={{ duration: 0.05 }}
          >
            <Icon className={styles[status]} type="play-unprocessed" />
          </motion.div>
        </div>
        <div title={displayedTitle} className="overflow-hidden overflow-ellipsis whitespace-nowrap">
          {displayedTitle}
        </div>
      </div>
      <div className="shrink-0 overflow-hidden overflow-ellipsis whitespace-nowrap">
        {getTruncatedRelativeDate(date)}
      </div>
    </a>
  );
}
