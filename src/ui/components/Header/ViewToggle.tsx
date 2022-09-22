import React from "react";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import classnames from "classnames";
import { isTest } from "ui/utils/environment";
import hooks from "ui/hooks";
import { setViewMode } from "ui/actions/layout";
import { ViewMode } from "ui/state/layout";
import { getViewMode } from "ui/reducers/layout";
import { Nag } from "ui/hooks/users";
import { shouldShowNag } from "ui/utils/user";
import MaterialIcon from "../shared/MaterialIcon";

const MODES = [
  {
    mode: "non-dev",
    label: "Viewer",
  },
  {
    mode: "dev",
    label: "DevTools",
  },
] as const;

export default function ViewToggle() {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector(getViewMode);
  const recordingId = hooks.useGetRecordingId();
  const { recording, loading } = hooks.useGetRecording(recordingId);
  const { userId } = hooks.useGetUserId();
  const isAuthor = userId && userId == recording?.userId;
  const dismissNag = hooks.useDismissNag();
  const { nags } = hooks.useGetUserInfo();

  const showDevtoolsNag = shouldShowNag(nags, Nag.VIEW_DEVTOOLS) && viewMode != "dev";

  const handleToggle = async (mode: ViewMode) => {
    dispatch(setViewMode(mode));
    if (showDevtoolsNag) {
      dismissNag(Nag.VIEW_DEVTOOLS);
    }
  };

  const shouldHide = isAuthor && !recording?.isInitialized && !isTest();

  if (loading || shouldHide) {
    return null;
  }

  return (
    <div className="flex">
      {showDevtoolsNag && (
        <button
          type="button"
          onClick={() => handleToggle("dev")}
          className="mr-3 flex items-center space-x-1.5 rounded-lg bg-primaryAccent text-sm text-buttontextColor hover:bg-primaryAccentHover"
          style={{ padding: "5px 12px" }}
        >
          <div className="overflow-hidden whitespace-nowrap">
            Welcome to replay ❤️ Check out DevTools!
          </div>
          <MaterialIcon style={{ fontSize: "16px" }}>arrow_forward</MaterialIcon>
        </button>
      )}
      <div className="view-toggle" role="button">
        <div
          className="handle"
          style={{
            left: `${(MODES.findIndex(({ mode }) => mode === viewMode) / MODES.length) * 100}%`,
          }}
        ></div>
        {MODES.map(({ mode, label }) => (
          <div key={mode} className="option" onClick={() => handleToggle(mode)}>
            <div className={classnames("text", { active: viewMode === mode })}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
