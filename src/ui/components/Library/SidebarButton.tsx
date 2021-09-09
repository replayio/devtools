import React from "react";
import classNames from "classnames";

export default function SidebarButton({
  children,
  underline = false,
  shouldHighlight = false,
  onClick = () => {},
}: {
  children: React.ReactNode;
  underline?: boolean;
  shouldHighlight?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <a
      className={classNames(
        `group px-4 py-2 hover:bg-gray-900 hover:text-white transition duration-200 text-left flex flex-row justify-between focus:outline-none cursor-pointer`,
        { underline },
        shouldHighlight ? "bg-gray-900 cursor-auto text-white" : ""
      )}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
