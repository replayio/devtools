/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { HTMLProps, PureComponent, ReactNode } from "react";
import classnames from "classnames";
import { Item, documentHasSelection } from "../utils";
import { trackEvent } from "ui/utils/telemetry";

export interface ObjectInspectorItemProps {
  item: Item;
  depth: number;
  focused: boolean;
  expanded: boolean;
  arrow: ReactNode;
  mode: Symbol;
  setExpanded: (item: Item, expand: boolean) => void;
  dimTopLevelWindow?: boolean;
  onDoubleClick?: (
    item: Item,
    opts: { depth: number; focused: boolean; expanded: boolean }
  ) => void;
  onContextMenu: (e: React.MouseEvent, item: Item) => void;
  onLabelClick?: (
    item: Item,
    opts: {
      depth: number;
      focused: boolean;
      expanded: boolean;
      setExpanded: (item: Item, expand: boolean) => void;
    }
  ) => void;
  renderItemActions: (item: Item) => ReactNode;
}

class ObjectInspectorItem extends PureComponent<ObjectInspectorItemProps> {
  static get defaultProps() {
    return {
      onContextMenu: () => {},
      renderItemActions: () => null,
    };
  }

  getTreeItemProps() {
    const { item, depth, focused, expanded, onDoubleClick, dimTopLevelWindow, onContextMenu } =
      this.props;

    const parentElementProps: HTMLProps<HTMLDivElement> = {
      key: item.path,
      className: classnames("node object-node", {
        focused,
        lessen:
          !expanded &&
          item.type === "value" &&
          (item.isPrototype() || (dimTopLevelWindow === true && item.isWindow() && depth === 0)),
      }),
      onClick: e => {
        // If this click happened because the user selected some text, bail out.
        // Note that if the user selected some text before and then clicks here,
        // the previously selected text will be first unselected, unless the
        // user clicked on the arrow itself. Indeed because the arrow is an
        // image, clicking on it does not remove any existing text selection.
        // So we need to also check if the arrow was clicked.
        const target = e.target as Element;
        if (
          target &&
          documentHasSelection(target.ownerDocument) &&
          !(target.matches && target.matches(".arrow"))
        ) {
          e.stopPropagation();
        }
      },
      onContextMenu: e => onContextMenu(e, item),
    };

    if (onDoubleClick) {
      parentElementProps.onDoubleClick = e => {
        e.stopPropagation();
        onDoubleClick(item, {
          depth,
          focused,
          expanded,
        });
      };
    }

    return parentElementProps;
  }

  renderLabel(label: ReactNode) {
    if (label === null || typeof label === "undefined") {
      return null;
    }

    const { item, depth, focused, expanded, onLabelClick } = this.props;
    return (
      <span
        className="object-label"
        onClick={
          onLabelClick
            ? (event: React.MouseEvent) => {
                event.stopPropagation();
                trackEvent("object_inspector.label_click");

                // If the user selected text, bail out.
                if (documentHasSelection((event.target as Element).ownerDocument)) {
                  return;
                }

                onLabelClick(item, {
                  depth,
                  focused,
                  expanded,
                  setExpanded: this.props.setExpanded,
                });
              }
            : undefined
        }
      >
        {label}
      </span>
    );
  }

  render() {
    const { arrow, renderItemActions, item } = this.props;

    const { label, value } = item.getLabelAndValue(this.props);
    const labelElement = this.renderLabel(label);
    const delimiter = value && labelElement ? <span className="object-delimiter">: </span> : null;

    return (
      <div {...this.getTreeItemProps()}>
        {arrow}
        {labelElement}
        {delimiter}
        {value}
        {renderItemActions(item)}
      </div>
    );
  }
}

export default ObjectInspectorItem;
