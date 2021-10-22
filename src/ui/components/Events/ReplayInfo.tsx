import React, { ReactNode } from "react";
import hooks from "ui/hooks";
import { OperationsData } from "ui/types";
import { formatRelativeTime } from "ui/utils/comments";
import { getRecordingId } from "ui/utils/environment";
import { AvatarImage } from "../Avatar";
import MaterialIcon from "../shared/MaterialIcon";
import { getPrivacySummaryAndIcon } from "../shared/SharingModal/PrivacyDropdown";

const Row = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-row space-x-2 p-1.5 px-3 items-center overflow-hidden">
      {children}
    </div>
  );
};

const getRecordingOperationsSummary = (operations: OperationsData) => {
  const cookies = operations.cookies || [];
  const localStorage = operations.storage || [];

  if (!cookies.length && !localStorage.length) {
    return;
  }

  let summary = [];

  if (cookies.length) {
    summary.push(`cookies from ${cookies.length} domain${cookies.length === 1 ? "" : "s"}`);
  }

  if (localStorage.length) {
    summary.push(
      `local storage from ${localStorage.length} domain${cookies.length === 1 ? "" : "s"}`
    );
  }

  if (summary.length > 1) {
    summary.splice(-1, 0, "and");
  }

  return `Accesses ${summary.join(" ")}`;
};

export const ReplayInfo = () => {
  const { recording } = hooks.useGetRecording(getRecordingId()!);

  if (!recording) return null;

  const time = formatRelativeTime(new Date(recording.date));
  const { summary, icon } = getPrivacySummaryAndIcon(recording);

  return (
    <div className="flex-grow overflow-auto overflow-x-hidden flex flex-column items-center bg-white border-b border-splitter">
      <div className="flex flex-col p-1.5 self-stretch space-y-1.5 w-full text-xs group">
        <Row>
          <AvatarImage className="h-5 w-5 rounded-full avatar" src={recording.user?.picture} />
          <div className="">{recording?.user?.name}</div>
          <div className="">{time}</div>
        </Row>
        <Row>
          <MaterialIcon className="">{icon}</MaterialIcon>
          <div className="">{summary}</div>
        </Row>
        {recording.operations ? (
          <Row>
            <MaterialIcon className="">info</MaterialIcon>
            <div className="">{getRecordingOperationsSummary(recording.operations)}</div>
          </Row>
        ) : null}
      </div>
    </div>
  );
};
