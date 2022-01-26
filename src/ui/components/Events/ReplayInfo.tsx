import React, { ReactNode } from "react";
import hooks from "ui/hooks";
import { OperationsData } from "ui/types";
import { formatRelativeTime } from "ui/utils/comments";
import { getDisplayedUrl } from "ui/utils/environment";
import { AvatarImage } from "../Avatar";
import MaterialIcon from "../shared/MaterialIcon";
import { getPrivacySummaryAndIcon } from "../shared/SharingModal/PrivacyDropdown";
import { getUniqueDomains } from "../UploadScreen/Privacy";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import { showDurationWarning, getRecordingId } from "ui/utils/recording";

const Row = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => {
  const classes = "flex flex-row space-x-2 p-1.5 px-3 items-center text-left overflow-hidden";

  if (onClick) {
    return (
      <button className={classes} onClick={onClick}>
        {children}
      </button>
    );
  }

  return <div className={classes}>{children}</div>;
};

function ReplayInfo({ setModal }: PropsFromRedux) {
  const { recording } = hooks.useGetRecording(getRecordingId()!);

  if (!recording) return null;

  const time = formatRelativeTime(new Date(recording.date));
  const { summary, icon } = getPrivacySummaryAndIcon(recording);

  const showOperations = () => {
    setModal("privacy");
  };

  return (
    <div className="flex-grow overflow-auto overflow-x-hidden flex flex-column items-center bg-white border-splitter">
      <div className="flex flex-col p-1.5 self-stretch space-y-1.5 w-full text-xs">
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

        <div className="group">
          <Row>
            <MaterialIcon iconSize="xl" className="group-hover:text-primaryAccent">
              language
            </MaterialIcon>
            <div className="overflow-hidden overflow-ellipsis whitespace-pre" title={recording.url}>
              <a href={recording.url} target="_blank" rel="noopener noreferrer">
                {getDisplayedUrl(recording.url)}
              </a>
            </div>
          </Row>
        </div>

        {recording.operations ? (
          <OperationsRow operations={recording.operations} onClick={showOperations} />
        ) : null}
        {showDurationWarning(recording) ? <WarningRow /> : null}
      </div>
    </div>
  );
}

function WarningRow() {
  return (
    <Row>
      <MaterialIcon iconSize="xl">warning_amber</MaterialIcon>
      <div>This replay is over two minutes, which can cause delays</div>
    </Row>
  );
}

function OperationsRow({
  operations,
  onClick,
}: {
  operations: OperationsData;
  onClick: () => void;
}) {
  const uniqueDomains = getUniqueDomains(operations);

  return (
    <div className="group">
      <Row onClick={onClick}>
        <MaterialIcon iconSize="xl" className="group-hover:text-primaryAccent">
          info
        </MaterialIcon>
        <div>{`Contains potentially sensitive data from ${uniqueDomains.length} domains`}</div>
      </Row>
    </div>
  );
}

const connector = connect(() => ({}), {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ReplayInfo);
