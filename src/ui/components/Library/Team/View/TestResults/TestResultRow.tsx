import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getRecordingURL } from "ui/utils/recording";
import { Recording, RecordingMetadata, TestMetadata } from "ui/types";
import { AttributeContainer } from "../TestRuns/AttributeContainer";
import { getTruncatedRelativeDate } from "../Recordings/RecordingListItem/RecordingListItem";
import styles from "../../../Library.module.css";

function Title({ metadata }: { metadata: RecordingMetadata }) {
  const title =
    metadata?.source?.merge?.title || metadata?.source?.commit.title || metadata?.test?.title || "";
  const formatted = title.length > 80 ? title.slice(0, 80) + "..." : title;
  return (
    <div className="flex pr-2 overflow-hidden font-medium wrap shrink grow-0 flex-nowrap text-ellipsis">
      {formatted}
    </div>
  );
}

function Status({ test }: { test: TestMetadata }) {
  return (
<div className={`flex self-start pt-0.5 ${test.result === "passed" ? "text-red-500" : "text-green-500"} `}>
<MaterialIcon iconSize="xl">{`${test.result === "passed" ? "cancel" : "check"} `}</MaterialIcon>
</div>
  );
}

function Attributes({ recording }: { recording: Recording }) {
  const user = recording.metadata.source?.trigger?.user;
  const branch = recording.metadata.source?.branch;
  const merge = recording.metadata.source?.merge;
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
    <a href={getRecordingURL(recording)} style={{ color: "inherit", textDecoration: "inherit" }}>
      <div
        className={`flex flex-row items-center px-3 py-3 space-x-3 border-b overflow-hidden rounded-sm cursor-pointer ${styles.libraryRow}`}
      >
        <Status test={recording.metadata.test} />
        <div className="flex flex-col flex-grow space-y-2">
          <div className="flex flex-row justify-between">
            <Title metadata={recording.metadata} />
          </div>
          <Attributes recording={recording} />
        </div>
      </div>
    </a>
  );
}
