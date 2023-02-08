/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import classnames from "classnames";
import React, { Component, useLayoutEffect, useRef } from "react";

import { copyToClipboard } from "replay-next/components/sources/utils/clipboard";
import { Redacted } from "ui/components/Redacted";
import type { SourceDetails } from "ui/reducers/sources";
import { getHasSiblingOfSameName } from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";

import { getSourceQueryString } from "../../utils/source";
import { getPathWithoutThread, isDirectory } from "../../utils/sources-tree";
import { TreeNode } from "../../utils/sources-tree/types";
import AccessibleImage from "../shared/AccessibleImage";
import SourceIcon from "../shared/SourceIcon";

interface STIProps {
  item: TreeNode;
  depth: number;
  focused: boolean;
  autoExpand: boolean;
  expanded: boolean;
  focusItem: (item: TreeNode) => void;
  selectItem: (item: TreeNode) => void;
  source: SourceDetails;
  debuggeeUrl: string;
  setExpanded: (item: TreeNode, a: boolean, b: boolean) => void;
}

function getItemName(item: TreeNode) {
  switch (item.name) {
    case "ng://":
      return "Angular";
    case "webpack://":
      return "Webpack";
    default:
      return `${unescape(item.name)}`;
  }
}

interface TreeIconProps {
  item: TreeNode;
  source: SourceDetails;
  depth: number;
}

function SourceTreeIcon({ item, source, depth }: TreeIconProps) {
  if (item.name === "webpack://") {
    return <AccessibleImage className="webpack" />;
  } else if (item.name === "ng://") {
    return <AccessibleImage className="angular" />;
  }

  if (isDirectory(item)) {
    // Domain level
    if (depth === 0) {
      return <AccessibleImage className="globe-small" />;
    }
    return <AccessibleImage className="folder" />;
  }

  if (source) {
    return <SourceIcon source={source} shouldHide={(icon: string) => icon === "extension"} />;
  }

  return null;
}

function SourceTreeItem2({
  autoExpand,
  item,
  depth,
  focused,
  source,
  expanded,
  focusItem,
  selectItem,
  setExpanded,
}: STIProps) {
  const hasSiblingOfSameName = useAppSelector(state => getHasSiblingOfSameName(state, source));

  const isFirstMountRef = useRef(true);

  useLayoutEffect(() => {
    if (autoExpand && isFirstMountRef.current) {
      setExpanded(item, true, false);
    }

    isFirstMountRef.current = false;
  }, [autoExpand, setExpanded, item]);

  const onClick = () => {
    focusItem(item);
    if (!isDirectory(item)) {
      selectItem(item);
    }
  };

  let querystring;
  if (hasSiblingOfSameName) {
    querystring = getSourceQueryString(source);
  }

  const query =
    hasSiblingOfSameName && querystring ? <span className="query">{querystring}</span> : null;

  const tooltip =
    item.type === "source" ? unescape(item.contents.url!) : getPathWithoutThread(item.path);

  const shouldShowArrow = isDirectory(item) || item.type === "multiSource";
  const itemArrow = shouldShowArrow ? (
    <AccessibleImage className={classnames("arrow", { expanded })} />
  ) : (
    <span className="img no-arrow" />
  );

  return (
    <div
      className={classnames("node", { focused })}
      data-item-name={`SourceTreeItem-${item.name.replace(/ /g, "")}`}
      key={item.path}
      onClick={onClick}
      // onContextMenu={e => this.onContextMenu(e, item)}
      title={tooltip}
    >
      {itemArrow}
      <SourceTreeIcon source={source} depth={depth} item={item} />

      <Redacted className="label">
        {getItemName(item)}
        {query}
      </Redacted>
    </div>
  );
}

export default React.memo(SourceTreeItem2);
