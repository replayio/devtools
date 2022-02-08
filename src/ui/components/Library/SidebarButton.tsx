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
        `group flex flex-row justify-between space-x-2 px-4 py-2 text-left transition duration-200 hover:bg-gray-900 hover:text-white focus:outline-none`,
        { underline },
        shouldHighlight ? "cursor-auto bg-gray-900 text-white" : "cursor-pointer"
      )}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
