import { Menu } from "@headlessui/react";
import classNames from "classnames";
import React, { MutableRefObject, useRef } from "react";
import { createPortal } from "react-dom";
import useModalDismissSignal from "ui/hooks/useModalDismissSignal";

import Icon from "../shared/Icon";

type ContextMenuProps = {
  children: React.ReactNode;
  menuItemsClassName?: string;
  widthClass?: "w-56" | "w-64" | "w-80";
  fontSizeClass?: "text-sm" | "text-base";
  close: () => void;
  x: number;
  y: number;
};

export function ContextMenu({
  children,
  menuItemsClassName,
  widthClass = "w-56",
  fontSizeClass = "text-sm",
  x,
  y,
  close,
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close the context menu if the user clicks outside of it or types "Escape"
  useModalDismissSignal(ref as MutableRefObject<HTMLDivElement>, close);

  return createPortal(
    <div className="portal-dropdown-container">
      <div className="absolute" ref={ref} style={{ left: x, top: y, zIndex: 1001 }}>
        <Menu as="div" className="recording-options inline-block text-left">
          {({ open }) => (
            <Menu.Items
              static
              className={classNames(
                menuItemsClassName,
                widthClass,
                fontSizeClass,
                "right-0 origin-top-right rounded-md border-modalBorder bg-menuBgcolor shadow-lg ring-1 ring-black ring-opacity-5 backdrop-blur-sm focus:outline-none"
              )}
            >
              <div className="py-1">{children}</div>
            </Menu.Items>
          )}
        </Menu>
      </div>
    </div>,
    document.body
  );
}

export function ContextMenuItem({
  children,
  onClick,
}: {
  children: string | React.ReactElement;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <Menu.Item>
      {({ active }: { active: boolean }) => (
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

export function ContextMenuItemContent({
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
