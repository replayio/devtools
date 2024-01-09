import React, { ReactNode } from "react";
import { ConnectedProps, connect } from "react-redux";

import { OperationsData } from "shared/graphql/types";
import { getDisplayedUrl } from "shared/utils/environment";
import { getRecordingId, showDurationWarning } from "shared/utils/recording";
import * as actions from "ui/actions/app";
import { getTruncatedRelativeDate } from "ui/components/Library/Team/View/Recordings/RecordingListItem/RecordingListItem";
import hooks from "ui/hooks";
import { getRecordingTarget } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";
import useAuth0 from "ui/utils/useAuth0";

import { AvatarImage } from "../Avatar";
import Icon from "../shared/Icon";
import MaterialIcon from "../shared/MaterialIcon";
import { getPrivacySummaryAndIcon } from "../shared/SharingModal/PrivacyDropdown";
import PrivacyDropdown from "../shared/SharingModal/PrivacyDropdown";
import LabeledIcon from "../TestSuite/components/LabeledIcon";
import { isTestSuiteReplay } from "../TestSuite/utils/isTestSuiteReplay";
import { getUniqueDomains } from "../UploadScreen/Privacy";
import styles from "./ReplayInfo.module.css";

const Row = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => {
  const classes = "flex flex-row space-x-2 p-1 px-4 items-center text-left overflow-hidden";

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
  const { isAuthenticated } = useAuth0();
  const recordingTarget = useAppSelector(getRecordingTarget);
  const showEnvironmentVariables = recordingTarget == "node";

  if (!recording) {
    return null;
  }

  const time = getTruncatedRelativeDate(recording.date);
  const date = new Date(recording.date);
  const fullDateString = date.toLocaleString();
  const { summary, icon } = getPrivacySummaryAndIcon(recording);

  const showOperations = () => {
    setModal("privacy");
  };

  const isTest = isTestSuiteReplay(recording);
  return (
    <div className="flex-column flex items-center overflow-hidden border-splitter bg-bodyBgcolor">
      <div className="mt-.5 mb-2 flex w-full cursor-default flex-col self-stretch overflow-hidden px-1.5 pb-0 text-xs">
        <Row>
          {recording.user ? (
            <>
              <AvatarImage
                className="avatar rounded-full"
                style={{ height: "1.25rem", width: "1.25rem" }}
                src={recording.user.picture}
              />
              <div>{recording.user.name}</div>
              <div className="opacity-50" title={fullDateString}>
                {time}
              </div>
            </>
          ) : (
            <LabeledIcon
              iconClassname={styles.icon}
              icon="schedule"
              label={time}
              title={fullDateString}
              dataTestName="RecordingDate"
            />
          )}
        </Row>
        <div>
          {isAuthenticated ? (
            <Row>
              <Icon filename={`${icon}-circle`} className="cursor-pointer bg-iconColor" />
              <div>
                <PrivacyDropdown {...{ recording }} />
              </div>
            </Row>
          ) : null}
        </div>
        <div>
          {!isTest && recording.url ? (
            <Row>
              <Icon filename="link-circle" className="cursor-pointer bg-primaryAccent" />
              <div
                className="overflow-hidden overflow-ellipsis whitespace-pre hover:underline"
                title={recording.url}
              >
                <a href={recording.url} target="_blank" rel="noopener noreferrer">
                  {getDisplayedUrl(recording.url)}
                </a>
              </div>
            </Row>
          ) : null}
        </div>
        <div>
          {recording.metadata && (
            <>
              {isTest ? (
                <Row>
                  <MaterialIcon>person</MaterialIcon>
                  <div
                    className="overflow-hidden overflow-ellipsis whitespace-pre"
                    title={recording.metadata.source?.branch}
                  >
                    {recording.metadata.source?.trigger?.user}
                  </div>
                </Row>
              ) : null}

              {isTest ? (
                <Row>
                  <MaterialIcon>fork_right</MaterialIcon>
                  <div
                    className="overflow-hidden overflow-ellipsis whitespace-pre"
                    title={recording.metadata.source?.branch}
                  >
                    {recording.metadata.source?.branch}
                  </div>
                </Row>
              ) : null}
            </>
          )}
        </div>
        {recording.operations ? (
          <OperationsRow operations={recording.operations} onClick={showOperations} />
        ) : null}
        {showEnvironmentVariables ? <EnvironmentVariablesRow /> : null}

        {showDurationWarning(recording) ? <DurationWarningRow /> : null}
      </div>
    </div>
  );
}

function EnvironmentVariablesRow() {
  return (
    <div>
      <Row>
        <Icon filename="warning" className="bg-iconColor" />
        <div>This node recording contains all environment variables</div>
      </Row>
    </div>
  );
}

function DurationWarningRow() {
  return (
    <div>
      <Row>
        <Icon filename="warning" className="bg-iconColor" />
        <div>This replay is over two minutes, which can cause delays</div>
      </Row>
    </div>
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

  if (uniqueDomains.length == 0) {
    return null;
  }

  return (
    <div>
      <Row>
        <Icon filename="shield-check-circle" className="bg-[#F39A32]" />
        <div className="flex">
          {`Potentially sensitive data`}{" "}
          <span className="ml-1 flex align-top" onClick={onClick}>
            <Icon
              filename="learnmore-questionmark"
              className="bg-bodyColor hover:cursor-pointer"
              size="small"
            />
          </span>
        </div>
      </Row>
    </div>
  );
}

const connector = connect(null, {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ReplayInfo);
