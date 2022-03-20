/* This example requires Tailwind CSS v2.0+ */
import React, { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { useDispatch, useSelector } from "react-redux";
import classNames from "classnames";
import { ToolboxLayout } from "ui/state/layout";
import { getToolboxLayout } from "ui/reducers/layout";
import { setToolboxLayout } from "ui/actions/layout";
import Icon from "../shared/Icon";
import { ToolboxButton } from "./ToolboxButton";

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
    <div
      className={classNames(
        "px-4 py-2 cursor-pointer flex space-x-2",
        selected
          ? "bg-blue-500 text-white"
          : "bg-menuBgcolor text-menuColor hover:bg-menuHoverBgcolor"
      )}
      onClick={onClick}
    >
      {icon ? (
        <Icon filename={icon} className={classNames(selected ? "bg-white" : "bg-iconColor")} />
      ) : null}
      <div>{label}</div>
    </div>
  );
}

function LayoutOption({
  label,
  value,
  icon,
}: {
  label: string;
  value: ToolboxLayout;
  icon: string;
}) {
  const toolboxLayout = useSelector(getToolboxLayout);
  const dispatch = useDispatch();

  const onClick = () => {
    dispatch(setToolboxLayout(value));
  };

  return (
    <ToolboxOption onClick={onClick} label={label} selected={toolboxLayout == value} icon={icon} />
  );
}

export default function ToolboxOptions() {
  const toolboxLayout = useSelector(getToolboxLayout);

  return (
    <Menu as="div" className="secondary-toolbox-options relative z-20 inline-block text-left">
      <Menu.Button as="div">
        <ToolboxButton>
          <Icon filename={LAYOUT_ICONS[toolboxLayout]} className="bg-iconColor" />
        </ToolboxButton>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 w-56 origin-top-right rounded-md bg-menuBgcolor text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <Menu.Item as="div">
            <LayoutOption label="Dock to Bottom Right" value="ide" icon={LAYOUT_ICONS["ide"]} />
          </Menu.Item>
          <Menu.Item as="div">
            <LayoutOption label="Dock to Left" value="left" icon={LAYOUT_ICONS["left"]} />
          </Menu.Item>
          <Menu.Item as="div">
            <LayoutOption label="Dock to Bottom" value="bottom" icon={LAYOUT_ICONS["bottom"]} />
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
