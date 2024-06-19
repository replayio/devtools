import React, { ReactNode } from "react";
import { ConnectedProps, connect } from "react-redux";

import { getDisplayedUrl } from "shared/utils/environment";
import { getRecordingId, showDurationWarning } from "shared/utils/recording";
import * as actions from "ui/actions/app";
import hooks from "ui/hooks";
import { getAccessToken, getRecordingTarget } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";
import { getRelativeDate } from "ui/utils/time";

import { AvatarImage } from "../Avatar";
import Icon from "../shared/Icon";
import MaterialIcon from "../shared/MaterialIcon";
import { getPrivacySummaryAndIcon } from "../shared/SharingModal/PrivacyDropdown";
import PrivacyDropdown from "../shared/SharingModal/PrivacyDropdown";
import LabeledIcon from "../TestSuite/components/LabeledIcon";
import { isTestSuiteReplay } from "../TestSuite/utils/isTestSuiteReplay";
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
  const isAuthenticated = !!useAppSelector(getAccessToken);
  const recordingTarget = useAppSelector(getRecordingTarget);
  const showEnvironmentVariables = recordingTarget == "node";

  if (!recording) {
    return null;
  }

  const time = getRelativeDate(recording.date);
  const date = new Date(recording.date);
  const fullDateString = date.toLocaleString();
  const { icon } = getPrivacySummaryAndIcon(recording);

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
              <div className="flex w-full flex-col overflow-hidden">
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

const connector = connect(null, {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ReplayInfo);
