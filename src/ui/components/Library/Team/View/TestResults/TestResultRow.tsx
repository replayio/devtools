import { Recording, RecordingMetadata, TestMetadata } from "shared/graphql/types";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getRecordingURL } from "ui/utils/recording";

import { getTruncatedRelativeDate } from "../Recordings/RecordingListItem/RecordingListItem";
import { AttributeContainer } from "../TestRuns/AttributeContainer";
import styles from "../../../Library.module.css";

function Title({ metadata }: { metadata: RecordingMetadata }) {
  const title =
    metadata?.source?.merge?.title || metadata?.source?.commit.title || metadata?.test?.title || "";
  const formatted = title.length > 80 ? title.slice(0, 80) + "..." : title;
  return (
    <div className="wrap flex shrink grow-0 flex-nowrap overflow-hidden text-ellipsis pr-2 font-medium">
      {formatted}
    </div>
  );
}

function Status({ test }: { test: TestMetadata }) {
  return (
    <MaterialIcon
      iconSize="2xl"
      outlined
      className={
        test.result === "passed"
          ? "text-green-500 group-hover:text-green-400"
          : "text-red-500 group-hover:text-red-700"
      }
    >
      {test.result === "passed" ? "play_circle_filled" : "play_circle"}
    </MaterialIcon>
  );
}

function Attributes({ recording }: { recording: Recording }) {
  const user = recording.metadata?.source?.trigger?.user;
  const branch = recording.metadata?.source?.branch;
  const merge = recording.metadata?.source?.merge;
  const date = recording.date;

  return (
    <div className="flex flex-row items-center text-xs font-light">
      <AttributeContainer icon="schedule">{getTruncatedRelativeDate(date)}</AttributeContainer>
      <AttributeContainer icon="person">{user!}</AttributeContainer>

      {branch && !merge && (
        <AttributeContainer maxWidth="160px" icon="fork_right">
          {branch}
        </AttributeContainer>
      )}
      {merge && (
        <AttributeContainer maxWidth="160px" icon="fork_right">
          {merge.id}
        </AttributeContainer>
      )}
    </div>
  );
}

export default function TestResultRow({ recording }: { recording: Recording }) {
  if (!recording?.metadata?.test) {
    return null;
  }

  return (
    <a
      href={getRecordingURL(recording)}
      className="group"
      style={{ color: "inherit", textDecoration: "inherit" }}
      rel="noreferrer noopener"
      target="_blank"
    >
      <div
        className={`flex cursor-pointer flex-row items-center space-x-3 overflow-hidden rounded-sm border-b border-b-chrome px-3 py-3 ${styles.libraryRow}`}
      >
        <Status test={recording.metadata.test} />
        <div className="flex flex-grow flex-col space-y-2">
          <div className="flex flex-row justify-between">
            <Title metadata={recording.metadata} />
          </div>
          <Attributes recording={recording} />
        </div>
      </div>
    </a>
  );
}
