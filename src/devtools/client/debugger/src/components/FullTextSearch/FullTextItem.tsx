import classnames from "classnames";
import React from "react";

import { Redacted, RedactedSpan } from "ui/components/Redacted";

import { highlightMatches } from "../../utils/project-search";
import { getRelativePathWithoutFile, getURL } from "../../utils/sources-tree";
import AccessibleImage from "../shared/AccessibleImage";
import { SourceMatchEntry, SourceResultEntry } from "./search";

interface FTIProps {
  item: SourceResultEntry | SourceMatchEntry;
  focused: boolean;
  expanded: boolean;
  onSelect: (item: SourceMatchEntry) => void;
}

export function FullTextItem({ item, focused, expanded, onSelect }: FTIProps) {
  if (item.type === "RESULT") {
    const matchesLength = item.matches.length;
    const matches = ` (${matchesLength} match${matchesLength > 1 ? "es" : ""})`;
    const { filename, path } = getURL({ url: item.filepath });

    return (
      <div
        tabIndex={0}
        className={classnames("file-result focus:outline-none", { focused })}
        key={item.sourceId}
      >
        <AccessibleImage className={classnames("arrow", { expanded })} />
        <AccessibleImage className="file" />
        <RedactedSpan className="file-path">
          <span className="filename">{filename}</span>
          <span>{getRelativePathWithoutFile(path)}</span>
        </RedactedSpan>
        <RedactedSpan className="matches-summary">{matches}</RedactedSpan>
      </div>
    );
  }

  return (
    <Redacted className={classnames("result pl-4", { focused })} onClick={() => onSelect(item)}>
      {highlightMatches(item)}
    </Redacted>
  );
}
