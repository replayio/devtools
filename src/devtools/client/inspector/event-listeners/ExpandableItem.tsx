import cx from "classnames";
import React, { ReactNode, useState, FC } from "react";

type ExpandableItemProps = {
  header: ReactNode;
  children?: ReactNode;
};

export const ExpandableItem = ({ header, children }: ExpandableItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = children && React.Children.count(children) > 0;

  return (
    <div>
      <div className="grid auto-cols-max grid-flow-col items-center gap-1">
        <span
          className={cx("theme-twisty bg-center", {
            "opacity-0": !hasChildren,
            "cursor-pointer": hasChildren,
            open: isExpanded,
          })}
          onClick={() => setIsExpanded(!isExpanded)}
        ></span>
        <div>{header}</div>
      </div>
      {isExpanded && hasChildren && <div className="pl-3">{children}</div>}
    </div>
  );
};
