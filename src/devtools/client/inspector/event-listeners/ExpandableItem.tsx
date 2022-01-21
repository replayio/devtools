import cx from "classnames";
import React, { useState, VFC } from "react";

type ExpandableItemProps = {
  id: string;
  children?: ExpandableItemProps[];
};

export const ExpandableItem: VFC<ExpandableItemProps> = ({ id, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasChildren = children && children.length > 0;

  return (
    <div>
      <div className="grid auto-cols-max gap-1">
        <span
          className={cx({
            "opacity-0": !hasChildren,
            "cursor-pointer": hasChildren,
            "-rotate-90": isExpanded,
          })}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          ▶
        </span>
        <div>{id}</div>
      </div>
      {hasChildren && (
        <div>
          {children?.map(child => (
            <ExpandableItem key={child.id} {...child} />
          ))}
        </div>
      )}
    </div>
  );
};
