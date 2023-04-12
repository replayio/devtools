import React, { ReactNode, useContext, useState } from "react";

import { recordingCapabilitiesCache } from "replay-next/src/suspense/BuildIdCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { setToolboxLayout } from "ui/actions/layout";
import { getToolboxLayout } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { ToolboxLayout } from "ui/state/layout";

import { Dropdown, DropdownItem } from "../Library/LibraryDropdown";
import Icon from "../shared/Icon";
import PortalDropdown from "../shared/PortalDropdown";

const LAYOUT_ICONS = {
  bottom: "dock-bottom",
  full: "dock-full",
  ide: "dock-bottom-right",
  left: "dock-left",
};

function ToolboxOption({
  dataTestId,
  label,
  onClick,
  icon,
}: {
  dataTestId?: string;
  label: string;
  onClick: () => void;
  icon?: string;
}) {
  return (
    <DropdownItem onClick={onClick}>
      <div className="flex space-x-2" data-test-id={dataTestId}>
        {icon ? <Icon filename={icon} className="bg-iconColor" /> : null}
        <div>{label}</div>
      </div>
    </DropdownItem>
  );
}

function LayoutOption({
  dataTestId,
  label,
  value,
  icon,
  collapseDropdown,
}: {
  dataTestId?: string;
  label: string;
  value: ToolboxLayout;
  icon: string;
  collapseDropdown: () => void;
}) {
  const dispatch = useAppDispatch();

  const onClick = () => {
    dispatch(setToolboxLayout(value));
    collapseDropdown();
  };

  return <ToolboxOption dataTestId={dataTestId} onClick={onClick} label={label} icon={icon} />;
}

export default function ToolboxOptions() {
  const replayClient = useContext(ReplayClientContext);
  const toolboxLayout = useAppSelector(getToolboxLayout);
  const [expanded, setExpanded] = useState(false);
  const button = <Icon filename={LAYOUT_ICONS[toolboxLayout]} className="bg-iconColor" />;
  const collapseDropdown = () => setExpanded(false);

  const recordingCapabilities = recordingCapabilitiesCache.read(replayClient);

  let layoutOptions: ReactNode = null;

  if (recordingCapabilities.supportsRepaintingGraphics) {
    layoutOptions = (
      <>
        <LayoutOption
          dataTestId="DockToBottomRightButton"
          label="Console on bottom-right"
          value="ide"
          icon={LAYOUT_ICONS.ide}
          collapseDropdown={collapseDropdown}
        />
        <LayoutOption
          dataTestId="DockToLeftButton"
          label="Console on left"
          value="left"
          icon={LAYOUT_ICONS.left}
          collapseDropdown={collapseDropdown}
        />
        <LayoutOption
          dataTestId="DockToBottomButton"
          label="Console on bottom"
          value="bottom"
          icon={LAYOUT_ICONS.bottom}
          collapseDropdown={collapseDropdown}
        />
      </>
    );
  } else {
    layoutOptions = (
      <>
        <LayoutOption
          dataTestId="DockSplitViewButton"
          label="Split view"
          value="ide"
          icon={LAYOUT_ICONS.left}
          collapseDropdown={collapseDropdown}
        />
        <LayoutOption
          dataTestId="DockFullViewButton"
          label="Full view"
          value="full"
          icon={LAYOUT_ICONS.full}
          collapseDropdown={collapseDropdown}
        />
      </>
    );
  }

  return (
    <PortalDropdown
      buttonContent={button}
      setExpanded={setExpanded}
      expanded={expanded}
      buttonStyle="toolbox-options p-2 flex items-center text-iconColor hover:text-gray-600"
      distance={0}
    >
      <Dropdown>{layoutOptions}</Dropdown>
    </PortalDropdown>
  );
}
