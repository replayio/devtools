import { RecordingId } from "@replayio/protocol";
import { motion } from "framer-motion";
import orderBy from "lodash/orderBy";

import Icon from "replay-next/components/Icon";
import { TestExecution } from "shared/test-suites/TestRun";

import { getTruncatedRelativeDate } from "../../Recordings/RecordingListItem/RecordingListItem";
import { TestSuitePanelMessage } from "../../TestSuitePanelMessage";
import styles from "../../../../Library.module.css";

export function ReplayList({ executions, label }: { executions: TestExecution[]; label: string }) {
  const hasExecutionsWithoutReplays = executions.some(e => e.recordings.length === 0);
  const sortedReplays = orderBy(
    executions.filter(e => e.recordings.length > 0),
    "createdAt",
    "desc"
  );

  let children = null;

  if (!sortedReplays.length) {
    children = <TestSuitePanelMessage>No replays found</TestSuitePanelMessage>;
  } else {
    children = sortedReplays.map((e, i) =>
      e.recordings.map(r => (
        <ReplayListItem
          recordingId={r.id}
          recordingTitle={r.title}
          isProcessed={r.isProcessed}
          commitTitle={e.commitTitle}
          date={e.createdAt}
          key={i}
          status={e.result}
        />
      ))
    );
  }

  return (
    <div className="flex flex-col gap-2 py-2">
      <div className="flex flex-col gap-2">
        <div className={styles.replayListTitle}>
          <div className={styles.labelText}>{label}</div>
        </div>
        <div className="flex flex-col">
          {hasExecutionsWithoutReplays ? (
            <div className="p-3">
              <Alert
                reason={AlertType.MISSING_REPLAYS_FOR_TEST}
                link="https://docs.replay.io/test-suites"
              />
            </div>
          ) : null}
          {children}
        </div>
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
    <a href={`/recording/${recordingId}`} className={styles.replayRow}>
      <div className="flex items-center gap-2 overflow-x-hidden">
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
        <div
          title={displayedTitle}
          className="flex-grow overflow-hidden overflow-ellipsis whitespace-nowrap"
        >
          {displayedTitle}
        </div>
      </div>
      <div className="shrink-0 overflow-hidden overflow-ellipsis whitespace-nowrap">
        {getTruncatedRelativeDate(date)}
      </div>
    </a>
  );
}
