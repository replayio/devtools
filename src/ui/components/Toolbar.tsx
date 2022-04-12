import React, { useState } from "react";
import classnames from "classnames";
import { connect, ConnectedProps, useDispatch, useSelector } from "react-redux";
import { actions } from "../actions";
import { selectors } from "../reducers";

import IconWithTooltip from "ui/components/shared/IconWithTooltip";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { UIState } from "ui/state";

// TODO [ryanjduffy]: Refactor shared styling more completely
import { trackEvent } from "ui/utils/telemetry";
import { PrimaryPanelName } from "ui/state/layout";
import classNames from "classnames";

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
  onClick,
  showBadge,
}: {
  icon: string;
  label: string;
  name: PrimaryPanelName;
  onClick?: () => void;
  showBadge?: boolean;
}) {
  const selectedPrimaryPanel = useSelector(selectors.getSelectedPrimaryPanel);
  const panelCollapsed = useSelector(selectors.getPaneCollapse);
  const dispatch = useDispatch();

  const handleClick = (panelName: PrimaryPanelName) => {
    if (onClick) {
      onClick();
    }
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
  const isPaused = useSelector(selectors.hasFrames);
  const viewMode = useSelector(selectors.getViewMode);
  const [hideCommentsBadge, setHideCommentsBadge] = useState(false);

  return (
    <div className="toolbox-toolbar-container flex flex-col items-center justify-between py-1">
      <div id="toolbox-toolbar space-y-1">
        <ToolbarButton icon="info" label="Replay Info" name="events" />
        <ToolbarButton
          icon="forum"
          label="Comments"
          name="comments"
          showBadge={!hideCommentsBadge}
          onClick={() => setHideCommentsBadge(true)}
        />
        {viewMode == "dev" ? (
          <>
            <ToolbarButton icon="description" name="explorer" label="Source Explorer" />
            <ToolbarButton icon="search" name="search" label="Search" />
            <ToolbarButton
              icon="motion_photos_paused"
              name="debugger"
              label="Pause Information"
              showBadge={isPaused}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
