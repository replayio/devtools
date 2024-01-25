import React from "react";

import Icon from "replay-next/components/Icon";

import dropdownStyles from "./Dropdown.module.css";

export function Dropdown({
  children,
  className,
  onClick,
  onKeyDown,
  label,
  ...rest
}: {
  onClick: (event: React.UIEvent<Element, UIEvent>) => void;
  onKeyDown: (event: React.KeyboardEvent<Element>) => void;
  label: string;
} & React.HTMLProps<HTMLDivElement>) {
  return (
    <>
      <div
        {...rest}
        className={`${dropdownStyles.dropdownTrigger} ${className ?? ""}`}
        onClick={onClick}
        onKeyDown={onKeyDown}
        tabIndex={0}
      >
        <div className="truncate">{label}</div>
        <Icon className="h-5 w-5 flex-shrink-0" type="chevron-down" />
      </div>
      {children}
    </>
  );
}
