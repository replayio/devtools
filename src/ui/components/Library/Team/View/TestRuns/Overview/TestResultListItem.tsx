import { motion } from "framer-motion";

import Icon from "replay-next/components/Icon";
import { Recording } from "shared/graphql/types";
import {
  isGroupedTestCasesV1,
  isGroupedTestCasesV2,
} from "shared/test-suites/RecordingTestMetadata";
import HighlightedText from "ui/components/Library/Team/View/TestRuns/HighlightedText";
import MaterialIcon from "ui/components/shared/MaterialIcon";

import styles from "../../../../Library.module.css";

export function TestResultListItem({
  depth,
  filterByText,
  label,
  recording,
  secondaryBadgeCount,
}: {
  depth: number;
  filterByText: string;
  label: string;
  recording: Recording;
  secondaryBadgeCount: number | null;
}) {
  const { comments, metadata } = recording;

  const numComments = comments?.length ?? 0;

  let filePath = "";
  let title = "";

  const testMetadata = metadata?.test;
  if (testMetadata != null) {
    if (isGroupedTestCasesV1(testMetadata)) {
      filePath = testMetadata.path?.[2] ?? "";
      title = testMetadata.title;
    } else if (isGroupedTestCasesV2(testMetadata)) {
      filePath = testMetadata.source.path;
      title = testMetadata.source.title || "";
    } else {
      filePath = testMetadata.source.filePath;
      title = testMetadata.source.title || "";
    }
  }

  label = label.toLowerCase();

  let color;
  switch (label) {
    case "failed":
      color = "#EB5757";
      break;
    case "flaky":
      color = "#FDBA00";
      break;
    case "passed":
    default:
      color = "#219653";
      break;
  }

  return (
    <a
      href={`/recording/${recording.id}`}
      className={`flex w-full flex-grow cursor-pointer flex-row items-center justify-center gap-2 truncate px-4 py-2 transition duration-150 ${styles.libraryRow}`}
      style={{
        paddingLeft: `${depth * 1}rem`,
      }}
    >
      <div className="flex flex-row items-center gap-1">
        {secondaryBadgeCount != null && <Icon className="ml-2 h-4 w-4" type="arrow-nested" />}
        <div className="flex cursor-pointer items-center justify-center transition ">
          <motion.div
            className="m-auto h-6 w-6 rounded-full hover:cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 1.0, boxShadow: "0px 0px 1px rgba(0,0,0,0.2)" }}
            transition={{ duration: 0.05 }}
          >
            <MaterialIcon iconSize="2xl" outlined style={{ color }}>
              {["passed", "flaky"].includes(label) ? "play_circle" : "play_circle_filled"}
            </MaterialIcon>
          </motion.div>
        </div>
      </div>
      <div className="flex shrink grow flex-col truncate">
        <div className="block truncate">{title || "Test"}</div>
        {filePath && (
          <div className="block truncate text-xs text-gray-600">
            <HighlightedText haystack={filePath} needle={filterByText} />
          </div>
        )}
      </div>
      {numComments > 0 && (
        <div className="align-items-center flex shrink-0 flex-row space-x-1 text-gray-600">
          <img src="/images/comment-outline.svg" className="w-3" />
          <span>{numComments}</span>
        </div>
      )}
    </a>
  );
}
