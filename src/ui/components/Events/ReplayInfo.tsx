import React, { ReactNode } from "react";
import hooks from "ui/hooks";
import { OperationsData } from "ui/types";
import { formatRelativeTime } from "ui/utils/comments";
import { getRecordingId } from "ui/utils/environment";
import { AvatarImage } from "../Avatar";
import MaterialIcon from "../shared/MaterialIcon";
import { getPrivacySummaryAndIcon } from "../shared/SharingModal/PrivacyDropdown";
import { getUniqueDomains } from "../UploadScreen/Privacy";

const Row = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-row space-x-2 p-1.5 px-3 items-center overflow-hidden">
      {children}
    </div>
  );
};

export const ReplayInfo = () => {
  const { recording } = hooks.useGetRecording(getRecordingId()!);

  if (!recording) return null;

  const time = formatRelativeTime(new Date(recording.date));
  const { summary, icon } = getPrivacySummaryAndIcon(recording);

  return (
    <div className="flex-grow overflow-auto overflow-x-hidden flex flex-column items-center bg-white border-b border-splitter">
      <div className="flex flex-col p-1.5 self-stretch space-y-1.5 w-full text-xs group">
        {recording.user ? (
          <Row>
            <AvatarImage className="h-5 w-5 rounded-full avatar" src={recording.user.picture} />
            <div>{recording.user.name}</div>
            <div className="opacity-50">{time}</div>
          </Row>
        ) : null}
        <Row>
          <MaterialIcon iconSize="xl">{icon}</MaterialIcon>
          <div>{summary}</div>
        </Row>
        {recording.operations ? <OperationsRow operations={recording.operations} /> : null}
      </div>
    </div>
  );
};

function OperationsRow({ operations }: { operations: OperationsData }) {
  const uniqueDomains = getUniqueDomains(operations);

  return (
    <Row>
      <MaterialIcon iconSize="xl">info</MaterialIcon>
      <div>{`Contains potentially sensitive data from ${uniqueDomains.length} domains`}</div>
    </Row>
  );
}
