import classnames from "classnames";
import classNames from "classnames";
import React, { useEffect, useState } from "react";

import { getPauseId } from "devtools/client/debugger/src/selectors";
import IconWithTooltip from "ui/components/shared/IconWithTooltip";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import hooks from "ui/hooks";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useFeature } from "ui/hooks/settings";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { PrimaryPanelName } from "ui/state/layout";
import { useGetFrames } from "ui/suspense/frameCache";
// TODO [ryanjduffy]: Refactor shared styling more completely
import { trackEvent } from "ui/utils/telemetry";

import { actions } from "../actions";
import { selectors } from "../reducers";

function ToolbarButtonTab({ active }: { active: boolean }) {
  return (
    <div
      className={classnames("absolute left-0 h-full w-1 bg-primaryAccent", {
        invisible: !active,
      })}
      style={{ borderRadius: "0 4px 4px 0" }}
    />
  );
}
function ToolbarButton({
  icon,
  label,
  name,
  showBadge,
}: {
  icon: string;
  label: string;
  name: PrimaryPanelName;
  showBadge?: boolean;
}) {
  const selectedPrimaryPanel = useAppSelector(selectors.getSelectedPrimaryPanel);
  const panelCollapsed = useAppSelector(selectors.getPaneCollapse);
  const dispatch = useAppDispatch();

  const handleClick = (panelName: PrimaryPanelName) => {
    if (panelCollapsed || (selectedPrimaryPanel == panelName && !panelCollapsed)) {
      trackEvent(`toolbox.toggle_sidebar`);
      dispatch(actions.togglePaneCollapse());
    }

    if (selectedPrimaryPanel != panelName) {
      trackEvent(`toolbox.primary.${panelName}_select`);
      dispatch(actions.setSelectedPrimaryPanel(panelName));
    }
  };

  return (
    <div className="relative px-2">
      <ToolbarButtonTab active={selectedPrimaryPanel == name} />
      <div
        className={classnames("toolbar-panel-button", name, {
          active: selectedPrimaryPanel == name,
        })}
      >
        <IconWithTooltip
          icon={
            <MaterialIcon
              className={classNames("toolbar-panel-icon text-themeToolbarPanelIconColor", name)}
              iconSize="2xl"
            >
              {icon}
            </MaterialIcon>
          }
          content={label}
          dataTestName={`ToolbarButton-${label.replace(/ /g, "")}`}
          handleClick={() => handleClick(name)}
        />
      </div>
      {showBadge ? (
        <div className="absolute top-1 left-3 mr-2 mb-1 h-2 w-2 rounded-full bg-secondaryAccent" />
      ) : null}
    </div>
  );
}

export default function Toolbar() {
  const pauseId = useAppSelector(getPauseId);
  const frames = useGetFrames(pauseId);
  const hasFrames = !!frames.value?.length;
  const viewMode = useAppSelector(selectors.getViewMode);
  const selectedPrimaryPanel = useAppSelector(getSelectedPrimaryPanel);
  const [showCommentsBadge, setShowCommentsBadge] = useState(false);
  const recordingId = useGetRecordingId();
  const { comments, loading } = hooks.useGetComments(recordingId);
  const { value: logProtocol } = useFeature("logProtocol");

  useEffect(() => {
    if (!loading && comments.length > 0) {
      setShowCommentsBadge(true);
    }
  }, [loading, comments.length]);

  useEffect(() => {
    if (selectedPrimaryPanel === "comments" && showCommentsBadge) {
      setShowCommentsBadge(false);
    }
  }, [selectedPrimaryPanel, showCommentsBadge]);

  return (
    <div className="toolbox-toolbar-container flex flex-col items-center justify-between py-1">
      <div id="toolbox-toolbar space-y-1">
        <ToolbarButton icon="info" label="Replay Info" name="events" />
        <ToolbarButton
          icon="forum"
          label="Comments"
          name="comments"
          showBadge={showCommentsBadge}
        />
        {viewMode == "dev" ? (
          <>
            <ToolbarButton icon="description" name="explorer" label="Source Explorer" />
            <ToolbarButton icon="search" name="search" label="Search" />
            <ToolbarButton
              icon="motion_photos_paused"
              name="debugger"
              label="Pause Information"
              showBadge={hasFrames}
            />
          </>
        ) : null}
        {logProtocol ? <ToolbarButton icon="code" label="Protocol" name="protocol" /> : null}
      </div>
    </div>
  );
}
