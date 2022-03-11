import React from "react";
import { Menu } from "@headlessui/react";
import classNames from "classnames";
import MaterialIcon from "../shared/MaterialIcon";
import Icon from "../shared/Icon";
import styles from "./Library.module.css";

// This should be the standard dropdown component for the Library
// but then we should slowly make it even more general purpose
// so that all dropdowns look the same.

export function DropdownButton({
  className,
  children,
  disabled,
}: {
  className?: string;
  children: React.ReactElement;
  disabled?: boolean;
}) {
  return (
    <Menu.Button
      className={classNames(className, "flex items-center px-1 py-2 text-sm")}
      disabled={disabled}
    >
      {children}
    </Menu.Button>
  );
}

export function Dropdown({
  children,
  menuItemsClassName,
  widthClass = "w-56",
  fontSizeClass = "text-sm",
}: {
  children: React.ReactNode;
  menuItemsClassName?: string;
  widthClass?: "w-56" | "w-64" | "w-80";
  fontSizeClass?: "text-sm" | "text-base";
}) {
  return (
    <Menu as="div" className="recording-options inline-block text-left">
      {({ open }) => (
        <Menu.Items
          static
          className={classNames(
            menuItemsClassName,
            widthClass,
            fontSizeClass,
            "right-0 origin-top-right rounded-md border-modalBorder bg-modalBgcolor shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          )}
        >
          <div className="py-1">{children}</div>
        </Menu.Items>
      )}
    </Menu>
  );
}

export function DropdownItem({
  children,
  onClick,
}: {
  children: string | React.ReactElement;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <Menu.Item>
      {({ active }) => (
        <a
          href="#"
          className={classNames(
            active ? "bg-menuHoverBgcolor text-menuHoverColor" : "text-menuColor",
            "block px-4 py-2"
          )}
          onClick={onClick}
        >
          {children}
        </a>
      )}
    </Menu.Item>
  );
}

export function DropdownItemContent({
  children,
  icon,
  selected,
}: {
  children: string | React.ReactElement;
  icon: string;
  selected: boolean;
}) {
  return (
    <div className="flex flex-row space-x-4">
      <div className={classNames("flex w-4 flex-row items-center")}>
        <Icon
          filename={icon}
          className={classNames(
            "group-hover:bg-primaryAccent",
            selected ? "bg-primaryAccent" : "bg-gray-400"
          )}
        />
      </div>
      <span className="overflow-hidden overflow-ellipsis whitespace-pre">{children}</span>
    </div>
  );
}

export function DropdownDivider() {
  return <div className={`w-full ${styles.dropdownDivider}`} />;
}
