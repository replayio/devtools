import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setToolboxLayout } from "ui/actions/layout";
import { getToolboxLayout } from "ui/reducers/layout";
import { ToolboxLayout } from "ui/state/layout";

import { Dropdown, DropdownItem } from "../Library/LibraryDropdown";
import Icon from "../shared/Icon";

const LAYOUT_ICONS = { ide: "dock-bottom-right", left: "dock-left", bottom: "dock-bottom" };

function LayoutOption({
  label,
  value,
  icon,
}: {
  label: string;
  value: ToolboxLayout;
  icon: string;
}) {
  const dispatch = useDispatch();

  const onClick = () => {
    dispatch(setToolboxLayout(value));
  };

  return (
    <DropdownItem onClick={onClick}>
      <div className="flex space-x-2">
        {icon ? <Icon filename={icon} className="bg-iconColor" /> : null}
        <div>{label}</div>
      </div>
    </DropdownItem>
  );
}

export default function ToolboxOptions() {
  const toolboxLayout = useSelector(getToolboxLayout);

  return (

    <Dropdown
      trigger={
        <Icon filename={LAYOUT_ICONS[toolboxLayout]} className="bg-iconColor" />
      }
      triggerClassname="toolbox-options p-2 flex items-center text-iconColor hover:text-gray-600"
    >
      <LayoutOption
        label="Dock to Bottom Right"
        value="ide"
        icon={LAYOUT_ICONS["ide"]}
      />
      <LayoutOption
        label="Dock to Left"
        value="left"
        icon={LAYOUT_ICONS["left"]}
      />
      <LayoutOption
        label="Dock to Bottom"
        value="bottom"
        icon={LAYOUT_ICONS["bottom"]}
      />
    </Dropdown>
  );
}
