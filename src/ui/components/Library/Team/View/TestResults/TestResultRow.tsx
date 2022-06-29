import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useContext } from "react";
import { getRecordingURL } from "ui/utils/recording";
import { Recording, RecordingMetadata, TestMetadata } from "ui/types";
import { LibraryContext } from "../useFilters";
import { AttributeContainer } from "../TestRuns/AttributeContainer";
import { getTruncatedRelativeDate } from "../Recordings/RecordingListItem/RecordingListItem";

function Title({ metadata }: { metadata: RecordingMetadata }) {
  const title =
    metadata?.source?.merge?.title || metadata?.source?.commit.title || metadata?.test?.title || "";
  const formatted = title.length > 80 ? title.slice(0, 80) + "..." : title;
  return (
    <div className="flex pr-2 overflow-hidden font-semibold wrap shrink grow-0 flex-nowrap text-ellipsis">
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

export default function TestResultRow({
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
        className="flex flex-row items-center flex-grow px-4 py-3 space-x-3 overflow-hidden bg-white border-b rounded-md cursor-pointer hover:bg-gray-100"
        style={style}
      >
        <Status test={recording.metadata.test} />
        <div className="flex flex-col flex-grow space-y-1">
          <div className="flex flex-row justify-between">
            <Title metadata={recording.metadata} />
          </div>
          <Attributes selected={isSelected} recording={recording} />
        </div>
      </div>
    </a>
  );
}
