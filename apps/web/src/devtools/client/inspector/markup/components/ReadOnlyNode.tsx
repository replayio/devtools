import classnames from "classnames";
import React, { FC } from "react";

type ReadOnlyNodeProps = {
  displayName: string;
  isDocType: boolean;
  pseudoType: boolean;
};

const ReadOnlyNode: FC<ReadOnlyNodeProps> = ({ displayName, isDocType, pseudoType }) => (
  <span className={classnames("editor", { "comment doctype": isDocType })}>
    <span
      className={classnames("tag", { "theme-fg-color3": pseudoType })}
      tabIndex={isDocType ? -1 : undefined}
    >
      {pseudoType ? `::${pseudoType}` : displayName}
    </span>
  </span>
);

export default ReadOnlyNode;
