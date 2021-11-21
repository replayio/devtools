import React from "react";
import classnames from "classnames";
import { highlightMatches } from "../../utils/project-search";
import { getRelativePath } from "../../utils/sources-tree";
import AccessibleImage from "../shared/AccessibleImage";

export function FullTextItem({ item, focused, expanded, onSelect }) {
  if (item.type === "RESULT") {
    const matchesLength = item.matches.length;
    const matches = ` (${matchesLength} match${matchesLength > 1 ? "es" : ""})`;

    return (
      <div
        tabindex="0"
        className={classnames("file-result focus:outline-none", { focused })}
        key={item.sourceId}
      >
        <AccessibleImage className={classnames("arrow", { expanded })} />
        <AccessibleImage className="file" />
        <span className="file-path">{getRelativePath(item.filepath)}</span>
        <span className="matches-summary">{matches}</span>
      </div>
    );
  }

  return (
    <div className={classnames("result pl-4", { focused })} onClick={() => onSelect(item)}>
      {highlightMatches(item)}
    </div>
  );
}
