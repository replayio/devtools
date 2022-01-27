import React from "react";
import { Menu } from "@headlessui/react";
import classNames from "classnames";
import MaterialIcon from "../shared/MaterialIcon";

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
      className={classNames(className, "flex px-1 py-2 items-center text-default")}
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
  fontSizeClass = "text-default",
}: {
  children: React.ReactNode;
  menuItemsClassName?: string;
  widthClass?: "w-56" | "w-64" | "w-80";
  fontSizeClass?: "text-default" | "text-base";
}) {
  return (
    <Menu as="div" className="inline-block text-left recording-options">
      {({ open }) => (
        <Menu.Items
          static
          className={classNames(
            menuItemsClassName,
            widthClass,
            fontSizeClass,
            "origin-top-right right-0 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
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
            active ? "bg-gray-100 text-gray-900" : "text-gray-700",
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
      <div
        className={classNames(
          "w-4 flex flex-row items-center",
          selected ? "text-primaryAccent" : "text-gray-400"
        )}
      >
        <MaterialIcon outlined={true} style={{ fontSize: "20px" }}>
          {icon}
        </MaterialIcon>
      </div>
      <span className="whitespace-pre overflow-hidden overflow-ellipsis">{children}</span>
    </div>
  );
}

export function DropdownDivider() {
  return <div className="border-b border-gray-200 w-full" />;
}
