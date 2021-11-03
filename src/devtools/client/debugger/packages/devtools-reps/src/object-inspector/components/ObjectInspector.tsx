import React, { PureComponent } from "react";
import classnames from "classnames";
import { Tree } from "devtools/client/debugger/src/components/shared/tree";
import ObjectInspectorItem from "./ObjectInspectorItem";
import { createUnavailableValueFront, ValueFront } from "protocol/thread";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { isRegionLoaded } from "ui/reducers/app";
const Utils = require("../utils");
const { renderRep, shouldRenderRootsInReps } = Utils;
const {
  needsToLoad,
  needsToLoadChildren,
  getChildren,
  getParent,
  getValue,
  nodeIsPrimitive,
  nodeHasGetter,
  nodeHasSetter,
} = Utils.node;

export interface Item {
  name?: string;
  path: string;
  contents: ValueFront;
  childrenLoaded?: boolean;
}

interface PropsFromParent {
  roots: Item[];
  focusable?: boolean;
  disableWrap?: boolean;
  inline?: boolean;
  mode: Symbol;
  activeItem?: Item;
  focusedItem?: Item;
  autoExpandAll?: boolean;
  autoExpandDepth?: number;
  initiallyExpanded?: (item: Item) => boolean;
  onActivate?: (item: Item | undefined) => void;
  onFocus?: (item: Item | undefined) => void;
  rootsChanged?: () => void;
}

type ObjectInspectorProps = PropsFromRedux & PropsFromParent;

// This implements a component that renders an interactive inspector
// for looking at JavaScript objects. It expects descriptions of
// objects from the protocol, and will dynamically fetch children
// properties as objects are expanded.
//
// If you want to inspect a single object, pass the name and the
// protocol descriptor of it:
//
//  ObjectInspector({
//    name: "foo",
//    desc: { writable: true, ..., { value: { actor: "1", ... }}},
//    ...
//  })
//
// If you want multiple top-level objects (like scopes), you can pass
// an array of manually constructed nodes as `roots`:
//
//  ObjectInspector({
//    roots: [{ name: ... }, ...],
//    ...
//  });

// There are 3 types of nodes: a simple node with a children array, an
// object that has properties that should be children when they are
// fetched, and a primitive value that should be displayed with no
// children.

class OI extends PureComponent<ObjectInspectorProps> {
  roots: Item[] | undefined;
  expandedPaths = new Set<string>();
  activeItem: Item | undefined;
  focusedItem: Item | undefined;

  constructor(props: ObjectInspectorProps) {
    super(props);

    this.roots = this.props.roots;
    this.focusedItem = this.props.focusedItem;
    this.activeItem = this.props.activeItem;
  }

  getRoots = () => this.props.roots;

  getItemChildren = (item: Item) => {
    if (needsToLoad(item)) {
      const name = "Loading…";
      return [
        {
          name,
          contents: createUnavailableValueFront(),
          path: `${item.path}/${name}`,
        },
      ];
    }

    return getChildren({ item });
  };

  areItemsEqual = (item1: Item, item2: Item) => item1.path === item2.path;

  shouldItemUpdate = (prevItem: Item, nextItem: Item) =>
    prevItem.childrenLoaded !== nextItem.childrenLoaded;

  getNodeKey = (item: Item) => {
    return item.path && typeof item.path.toString === "function"
      ? item.path.toString()
      : item.contents.id();
  };

  isExpanded = (item: Item) => this.expandedPaths.has(item.path);

  isNodeExpandable = (item: Item) => {
    if (nodeIsPrimitive(item)) {
      return false;
    }

    if (nodeHasSetter(item) || nodeHasGetter(item)) {
      return false;
    }

    return true;
  };

  setExpanded = async (item: Item, expand: boolean) => {
    if (!this.isNodeExpandable(item) || !this.props.isRegionLoaded) {
      return;
    }
    if (expand) {
      this.expandedPaths.add(item.path);
    } else {
      this.expandedPaths.delete(item.path);
    }
    this.forceUpdate();

    if (expand && needsToLoadChildren(item)) {
      try {
        await getValue(item).loadChildren();
      } catch {
        this.expandedPaths.delete(item.path);
      }
      this.forceUpdate();
    }
  };

  expand = (item: Item) => this.setExpanded(item, true);

  collapse = (item: Item) => this.setExpanded(item, false);

  focusItem = (item: Item | undefined) => {
    const { focusable = true, onFocus } = this.props;

    if (focusable && this.focusedItem?.path !== item?.path) {
      this.focusedItem = item;
      this.forceUpdate();

      if (onFocus) {
        onFocus(item);
      }
    }
  };

  activateItem = (item: Item | undefined) => {
    const { focusable = true, onActivate } = this.props;

    if (focusable && this.activeItem?.path !== item?.path) {
      this.activeItem = item;
      this.forceUpdate();

      if (onActivate) {
        onActivate(item);
      }
    }
  };

  render() {
    const {
      autoExpandAll = true,
      autoExpandDepth = 1,
      initiallyExpanded,
      roots,
      focusedItem,
      activeItem,
      focusable = true,
      disableWrap = false,
      inline,
      rootsChanged,
    } = this.props;

    if (this.roots !== roots) {
      this.roots = roots;
      this.focusedItem = focusedItem;
      this.activeItem = activeItem;
      this.expandedPaths.clear();
      if (rootsChanged) {
        rootsChanged();
      }
    }

    return (
      <Tree
        className={classnames({
          inline,
          nowrap: disableWrap,
          "object-inspector": true,
        })}
        autoExpandAll={autoExpandAll}
        autoExpandDepth={autoExpandDepth}
        initiallyExpanded={initiallyExpanded}
        isExpanded={this.isExpanded}
        isExpandable={this.isNodeExpandable}
        focused={this.focusedItem}
        active={this.activeItem}
        getRoots={this.getRoots}
        getParent={getParent}
        getChildren={this.getItemChildren}
        areItemsEqual={this.areItemsEqual}
        shouldItemUpdate={this.shouldItemUpdate}
        getKey={this.getNodeKey}
        onExpand={this.expand}
        onCollapse={this.collapse}
        onFocus={focusable ? this.focusItem : undefined}
        onActivate={focusable ? this.activateItem : undefined}
        renderItem={(item, depth, focused, arrow, expanded) => (
          <ObjectInspectorItem
            {...{
              ...this.props,
              item,
              depth,
              focused,
              arrow,
              expanded,
              setExpanded: this.setExpanded,
            }}
          />
        )}
      />
    );
  }
}

function ObjectInspector(props: ObjectInspectorProps) {
  const { roots } = props;

  if (roots.length == 0) {
    return null;
  }

  if (shouldRenderRootsInReps(roots)) {
    return renderRep(roots[0], props);
  }

  return <OI {...props} />;
}

const connector = connect((state: UIState, { roots }: PropsFromParent) => ({
  isRegionLoaded: isRegionLoaded(state, roots[0]?.contents.getPause()?.time),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ObjectInspector);
