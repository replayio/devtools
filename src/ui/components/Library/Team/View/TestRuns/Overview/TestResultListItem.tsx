import Link from "next/link";

import Icon from "replay-next/components/Icon";
import { Recording } from "shared/graphql/types";
import {
  isGroupedTestCasesV1,
  isGroupedTestCasesV2,
} from "shared/test-suites/RecordingTestMetadata";
import MaterialIcon from "ui/components/shared/MaterialIcon";

import styles from "../../../../Library.module.css";

export function TestResultListItem({
  label,
  recording,
  secondaryBadgeCount,
}: {
  label: string;
  recording: Recording;
  secondaryBadgeCount: number | null;
}) {
  const { comments, metadata } = recording;

  const numComments = comments?.length ?? 0;

  let filePath;
  let title;

  const testMetadata = metadata?.test;
  if (testMetadata != null) {
    if (isGroupedTestCasesV1(testMetadata)) {
      filePath = testMetadata.file;
      title = testMetadata.title;
    } else if (isGroupedTestCasesV2(testMetadata)) {
      filePath = testMetadata.source.path;
      title = testMetadata.source.title;
    } else {
      filePath = testMetadata.source.filePath;
      title = testMetadata.source.title;
    }
  }

  label = label.toLowerCase();

  let bgColor;
  let bgColorHover;
  switch (label) {
    case "failed":
      bgColor = "#EB5757";
      bgColorHover = "red-500";
      break;
    case "flaky":
      bgColor = "#FDBA00";
      bgColorHover = "yellow-500";
      break;
    case "passed":
    default:
      bgColor = "#219653";
      bgColorHover = "green-500";
      break;
  }

  return (
    <Link
      href={`/recording/${recording.id}`}
      className={`flex w-full flex-grow cursor-pointer flex-row items-center justify-center gap-2 truncate px-4 py-2 transition duration-150 ${styles.libraryRow}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="flex flex-row items-center gap-1">
        {secondaryBadgeCount != null && <Icon className="ml-2 h-4 w-4" type="arrow-nested" />}
        <Link
          href={`/recording/${recording.id}`}
          className=" flex cursor-pointer items-center justify-center transition"
          onClick={e => e.stopPropagation()}
        >
          <MaterialIcon
            iconSize="2xl"
            outlined
            className={`text-[${bgColor}] group-hover:text-[${bgColorHover}]`}
          >
            {["passed", "flaky"].includes(label) ? "play_circle" : "play_circle_filled"}
          </MaterialIcon>
        </Link>
      </div>
      <div className="flex shrink grow flex-col truncate">
        <div className="block truncate">{title || "Test"}</div>
        <div className="truncate truncate text-xs text-bodySubColor">{filePath}</div>
      </div>
      {numComments > 0 && (
        <div className="align-items-center flex shrink-0 flex-row space-x-1 text-gray-600">
          <img src="/images/comment-outline.svg" className="w-3" />
          <span>{numComments}</span>
        </div>
      )}
    </Link>
  );
}
