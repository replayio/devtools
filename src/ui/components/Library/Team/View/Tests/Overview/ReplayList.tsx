import { RecordingId } from "@replayio/protocol";
import { motion } from "framer-motion";
import orderBy from "lodash/orderBy";

import Icon from "replay-next/components/Icon";
import { TestExecution } from "shared/test-suites/TestRun";

import { getTruncatedRelativeDate } from "../../Recordings/RecordingListItem/RecordingListItem";
import { MAX_REPLAYS_SHOWN } from "./TestDetails";
import styles from "../../../../Library.module.css";

export function ReplayList({ executions, label }: { executions: TestExecution[]; label: string }) {
  const sortedReplays = orderBy(
    executions.filter(e => e.recordings.length > 0),
    "createdAt",
    "desc"
  );

  let children = null;

  if (!sortedReplays.length) {
    children = <div>No replays found</div>;
  } else {
    children = (
      <>
        {sortedReplays.slice(0, MAX_REPLAYS_SHOWN).map((e, i) => (
          <ReplayListItem
            recordingId={e.recordings[0]!.id}
            recordingTitle={e.recordings[0]!.title}
            isProcessed={e.recordings[0]!.isProcessed}
            commitTitle={e.commitTitle}
            date={e.createdAt}
            key={i}
            status={e.result}
          />
        ))}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-2 px-4">
      <div className="flex flex-col gap-2">
        <div className="flex gap-1 overflow-hidden text-lg">
          <div className="overflow-hidden overflow-ellipsis whitespace-nowrap font-medium">
            {label}
          </div>
          <div> ({sortedReplays.length})</div>
        </div>
        <div className="flex flex-col gap-2">{children}</div>
      </div>
    </div>
  );
}
function ReplayListItem({
  recordingId,
  commitTitle,
  recordingTitle,
  isProcessed,
  date,
  status,
}: {
  recordingId: RecordingId;
  commitTitle: string | null;
  recordingTitle?: string | null;
  isProcessed?: boolean;
  date: string;
  status: TestExecution["result"];
}) {
  const displayedTitle = commitTitle || recordingTitle || "(commit title missing)";

  return (
    <a
      href={`/recording/${recordingId}`}
      className="flex cursor-pointer flex-row items-center justify-between gap-2"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <div className={styles.iconWrapper}>
          <motion.div
            className={styles.iconMotion}
            whileTap={{ scale: 1, boxShadow: "0px 0px 1px rgba(0,0,0,0.2)" }}
            transition={{ duration: 0.05 }}
          >
            <Icon
              className={styles[status]}
              type={isProcessed ? "play-processed" : "play-unprocessed"}
            />
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
