import React from "react";
import { Menu } from "@headlessui/react";
import classNames from "classnames";

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
      className={classNames(className, "flex px-1 py-2 items-center text-sm")}
      disabled={disabled}
    >
      {children}
    </Menu.Button>
  );
}

export function Dropdown({
  children,
  menuItemsClassName,
}: {
  children: (React.ReactElement | null)[];
  menuItemsClassName?: string;
}) {
  return (
    <Menu as="div" className="inline-block text-left recording-options">
      {({ open }) => (
        <Menu.Items
          static
          className={classNames(
            menuItemsClassName,
            "origin-top-right text-sm right-0 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
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
  children: string;
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

export function DropdownDivider() {
  return <div className="border-b border-gray-200 w-full" />;
}
