import { Menu } from "@headlessui/react";
import { createPopper, Options, flip, preventOverflow } from "@popperjs/core";
import classNames from "classnames";
import React, { useEffect, useState, RefCallback, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";

import Icon from "../shared/Icon";

import styles from "./Library.module.css";

// This should be the standard dropdown component for the Library
// but then we should slowly make it even more general purpose
// so that all dropdowns look the same.

export function Dropdown({
  children,
  trigger,
  menuItemsClassName,
  widthClass = "w-56",
  fontSizeClass = "text-sm",
  triggerClassname = "flex items-center px-1 py-2 text-sm outline-none",
  disabled = false,
  placement = "bottom-start",
  offset = 0,
}: {
  children: React.ReactNode;
  trigger: React.ElementType | React.ReactNode;
  disabled?: boolean;
  offset?: number;
  triggerClassname?: string;
  menuItemsClassName?: string;
  widthClass?: "w-56" | "w-64" | "w-80";
  fontSizeClass?: "text-sm" | "text-base";
  placement?: Options["placement"];
}) {
  let [triggerRef, containerRef] = usePopper({
    placement,
    modifiers: [{ name: "offset", options: { offset: [0, offset] } }, flip, preventOverflow],
  });

  return (
    <Menu as="div" className="recording-options inline-block text-left">
      <Menu.Button className={triggerClassname} disabled={disabled} ref={triggerRef}>
        {trigger}
      </Menu.Button>
      <Portal>
        <Menu.Items
          ref={containerRef}
          className={classNames(
            menuItemsClassName,
            widthClass,
            fontSizeClass,
            "z-[9999] right-0 origin-top-right rounded-md border-modalBorder bg-menuBgcolor shadow-lg ring-1 ring-black ring-opacity-5 backdrop-blur-sm focus:outline-none"
          )}
        >
          <div className="py-1">{children}</div>
        </Menu.Items>
      </Portal>
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
      {({ active }: { active: boolean }) => (
        <button
          className={classNames(
            active ? "bg-menuHoverBgcolor text-menuHoverColor" : "text-menuColor",
            "block px-4 py-2 w-full text-left"
          )}
          onClick={onClick}
        >
          {children}
        </button>
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
  selected?: boolean;
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

function Portal(props: { children: React.ReactNode }) {
  let { children } = props;
  let [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return null;
  }
  return createPortal(children, document.body);
}

export function usePopper(
  options?: Partial<Options>
): [RefCallback<Element | null>, RefCallback<HTMLElement | null>] {
  let reference = useRef<Element | null>(null);
  let popper = useRef<HTMLElement | null>(null);

  let cleanupCallback = useRef(() => {});

  let instantiatePopper = useCallback(() => {
    if (!reference.current) {
      return;
    }
    if (!popper.current) {
      return;
    }

    if (cleanupCallback.current) {
      cleanupCallback.current();
    }

    cleanupCallback.current = createPopper(reference.current, popper.current, options).destroy;
  }, [reference, popper, cleanupCallback, options]);

  return useMemo(
    () => [
      referenceDomNode => {
        reference.current = referenceDomNode;
        instantiatePopper();
      },
      popperDomNode => {
        popper.current = popperDomNode;
        instantiatePopper();
      },
    ],
    [reference, popper, instantiatePopper]
  );
}
