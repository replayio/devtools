import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { ToolboxLayout } from "ui/state/layout";
import { getToolboxLayout } from "ui/reducers/layout";
import { setToolboxLayout } from "ui/actions/layout";
import Icon from "../shared/Icon";
import { ToolboxButton } from "./ToolboxButton";
import PortalDropdown from "../shared/PortalDropdown";
import { Dropdown, DropdownItem } from "../Library/LibraryDropdown";

const LAYOUT_ICONS = { ide: "dock-bottom-right", left: "dock-left", bottom: "dock-bottom" };

function ToolboxOption({
  dataTestId,
  label,
  onClick,
  selected,
  icon,
}: {
  dataTestId?: string;
  label: string;
  onClick: () => void;
  selected: boolean;
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
  const toolboxLayout = useAppSelector(getToolboxLayout);
  const dispatch = useAppDispatch();

  const onClick = () => {
    dispatch(setToolboxLayout(value));
    collapseDropdown();
  };

  return (
    <ToolboxOption
      dataTestId={dataTestId}
      onClick={onClick}
      label={label}
      selected={toolboxLayout == value}
      icon={icon}
    />
  );
}

export default function ToolboxOptions() {
  const toolboxLayout = useAppSelector(getToolboxLayout);
  const [expanded, setExpanded] = useState(false);
  const button = <Icon filename={LAYOUT_ICONS[toolboxLayout]} className="bg-iconColor" />;
  const collapseDropdown = () => setExpanded(false);

  return (
    <PortalDropdown
      buttonContent={button}
      setExpanded={setExpanded}
      expanded={expanded}
      buttonStyle="toolbox-options p-2 flex items-center text-iconColor hover:text-gray-600"
      distance={0}
    >
      <Dropdown>
        <LayoutOption
          dataTestId="DockToBottomRightButton"
          label="Dock to Bottom Right"
          value="ide"
          icon={LAYOUT_ICONS["ide"]}
          collapseDropdown={collapseDropdown}
        />
        <LayoutOption
          dataTestId="DockToLeftButton"
          label="Dock to Left"
          value="left"
          icon={LAYOUT_ICONS["left"]}
          collapseDropdown={collapseDropdown}
        />
        <LayoutOption
          dataTestId="DockToBottomButton"
          label="Dock to Bottom"
          value="bottom"
          icon={LAYOUT_ICONS["bottom"]}
          collapseDropdown={collapseDropdown}
        />
      </Dropdown>
    </PortalDropdown>
  );
}
