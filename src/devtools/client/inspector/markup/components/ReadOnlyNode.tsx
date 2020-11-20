import React, { PureComponent } from "react";

interface ReadOnlyNodeProps {
  displayName: string;
  isDocType: boolean;
  pseudoType: boolean;
}

class ReadOnlyNode extends PureComponent<ReadOnlyNodeProps> {
  render() {
    const { displayName, isDocType, pseudoType } = this.props;

    return (
      <span className={"editor" + (isDocType ? " comment doctype" : "")}>
        <span
          className={"tag" + (pseudoType ? " theme-fg-color3" : "")}
          tabIndex={isDocType ? -1 : undefined}
        >
          {pseudoType ? `::${pseudoType}` : displayName}
        </span>
      </span>
    );
  }
}

export default ReadOnlyNode;
