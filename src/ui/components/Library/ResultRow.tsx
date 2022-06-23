import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getTruncatedRelativeDate } from "./RecordingRow";
import { useContext } from "react";
import { LibraryContext } from "./useFilters";
import { AttributeContainer } from "./Content/TestRuns/AttributeContainer";
import { Recording, RecordingMetadata, TestMetadata } from "ui/types";
import { getRecordingURL } from "ui/utils/recording";

function Title({ metadata }: { metadata: RecordingMetadata }) {
  const title =
    metadata?.source?.merge?.title || metadata?.source?.commit.title || metadata?.test?.title || "";
  const formatted = title.length > 80 ? title.slice(0, 80) + "..." : title;
  return (
    <div className="wrap flex shrink grow-0 flex-nowrap overflow-hidden text-ellipsis pr-2 font-semibold">
      {formatted}
    </div>
  );
}

function Status({ test }: { test: TestMetadata }) {
  return (
    <div
      className={`flex self-start ${test.result === "passed" ? "text-green-600" : "text-red-500"} `}
    >
      <MaterialIcon iconSize="xl">radio_button_checked</MaterialIcon>
    </div>
  );
}

function Attributes({ recording, selected }: { recording: Recording; selected: boolean }) {
  const user = recording.metadata.source?.trigger?.user;
  const branch = recording.metadata.source?.branch;
  const merge = recording.metadata.source?.merge;
  const date = recording.date;

  const textColor = selected ? "text-gray-700" : "text-gray-500";
  return (
    <div className={`${textColor} flex flex-row items-center text-xs font-light`}>
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

export default function ResultRow({
  recording,
  selected,
}: {
  recording: Recording;
  selected: boolean;
}) {
  const { preview } = useContext(LibraryContext);
  const isSelected = preview?.id.toString() === recording.id;
  const style = {
    backgroundColor: isSelected ? "rgb(209 238 255)" : "",
  };

  if (!recording?.metadata?.test) {
    return null;
  }

  return (
    <a href={getRecordingURL(recording)} style={{ color: "inherit", textDecoration: "inherit" }}>
      <div
        className="flex flex-grow cursor-pointer flex-row items-center space-x-3 overflow-hidden rounded-md border-b bg-white px-4 py-3 hover:bg-gray-100"
        style={style}
      >
        <Status test={recording.metadata.test} />
        <div className="flex flex-grow flex-col space-y-1">
          <div className="flex flex-row justify-between">
            <Title metadata={recording.metadata} />
          </div>
          <Attributes selected={isSelected} recording={recording} />
        </div>
      </div>
    </a>
  );
}
