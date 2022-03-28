import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ToolboxLayout } from "ui/state/layout";
import { getToolboxLayout } from "ui/reducers/layout";
import { setToolboxLayout } from "ui/actions/layout";
import Icon from "../shared/Icon";
import { ToolboxButton } from "./ToolboxButton";
import PortalDropdown from "../shared/PortalDropdown";
import { Dropdown, DropdownItem } from "../Library/LibraryDropdown";

const LAYOUT_ICONS = { ide: "dock-bottom-right", left: "dock-left", bottom: "dock-bottom" };

function ToolboxOption({
  label,
  onClick,
  selected,
  icon,
}: {
  label: string;
  onClick: () => void;
  selected: boolean;
  icon?: string;
}) {
  return (
    <DropdownItem onClick={onClick}>
      <div className="flex space-x-2">
        {icon ? <Icon filename={icon} className="bg-iconColor" /> : null}
        <div>{label}</div>
      </div>
    </DropdownItem>
  );
}

function LayoutOption({
  label,
  value,
  icon,
  collapseDropdown,
}: {
  label: string;
  value: ToolboxLayout;
  icon: string;
  collapseDropdown: () => void;
}) {
  const toolboxLayout = useSelector(getToolboxLayout);
  const dispatch = useDispatch();

  const onClick = () => {
    dispatch(setToolboxLayout(value));
    collapseDropdown();
  };

  return (
    <ToolboxOption onClick={onClick} label={label} selected={toolboxLayout == value} icon={icon} />
  );
}

export default function ToolboxOptions() {
  const toolboxLayout = useSelector(getToolboxLayout);
  const [expanded, setExpanded] = useState(false);
  const button = (
    <ToolboxButton>
      <Icon filename={LAYOUT_ICONS[toolboxLayout]} className="bg-iconColor" />
    </ToolboxButton>
  );
  const collapseDropdown = () => setExpanded(false);

  return (
    <PortalDropdown
      buttonContent={button}
      setExpanded={setExpanded}
      expanded={expanded}
      buttonStyle=""
      distance={0}
    >
      <Dropdown>
        <LayoutOption
          label="Dock to Bottom Right"
          value="ide"
          icon={LAYOUT_ICONS["ide"]}
          collapseDropdown={collapseDropdown}
        />
        <LayoutOption
          label="Dock to Left"
          value="left"
          icon={LAYOUT_ICONS["left"]}
          collapseDropdown={collapseDropdown}
        />
        <LayoutOption
          label="Dock to Bottom"
          value="bottom"
          icon={LAYOUT_ICONS["bottom"]}
          collapseDropdown={collapseDropdown}
        />
      </Dropdown>
    </PortalDropdown>
  );
}
