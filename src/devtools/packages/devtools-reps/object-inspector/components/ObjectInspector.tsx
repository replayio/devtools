import React, { FC, PureComponent, ReactNode } from "react";
import classnames from "classnames";
import { Tree } from "devtools/client/debugger/src/components/shared/tree";
import ObjectInspectorItem from "./ObjectInspectorItem";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { isRegionLoaded } from "ui/reducers/app";
import { RedactedSpan } from "ui/components/Redacted";
import {
  Item,
  ValueItem,
  renderRep,
  shouldRenderRootsInReps,
  loadChildren,
  findPause,
} from "../utils";
import { SmartTraceStackFrame } from "devtools/client/shared/components/SmartTrace";
import { assert } from "protocol/utils";

interface PropsFromParent {
  roots: Item[] | (() => Item[]);
  defaultRep?: { rep: FC };
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
  renderStacktrace?: (stacktrace: SmartTraceStackFrame[]) => ReactNode;
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
  roots: Item[] | (() => Item[]) | undefined;
  expandedPaths = new Set<string>();
  activeItem: Item | undefined;
  focusedItem: Item | undefined;

  constructor(props: ObjectInspectorProps) {
    super(props);

    this.roots = this.props.roots;
    this.focusedItem = this.props.focusedItem;
    this.activeItem = this.props.activeItem;
  }

  getRoots = (): Item[] =>
    this.props.roots instanceof Function ? this.props.roots() : this.props.roots;

  getItemChildren = (item: Item): Item[] => item.getChildren();

  areItemsEqual = (item1: Item, item2: Item): boolean => item1.path === item2.path;

  shouldItemUpdate = (prevItem: Item, nextItem: Item): boolean => {
    if (prevItem.type === "value") {
      assert(nextItem.type === "value", "OI items for the same path must have the same type");
      return prevItem.needsToLoadChildren() !== nextItem.needsToLoadChildren();
    }
    if (prevItem.type === "getter") {
      assert(nextItem.type === "getter", "OI items for the same path must have the same type");
      return prevItem.loadingState !== nextItem.loadingState;
    }
    return false;
  };

  getItemKey = (item: Item): string => item.path;

  isExpanded = (item: Item): boolean => this.expandedPaths.has(item.path);

  isItemExpandable = (item: Item): boolean => !item.isPrimitive();

  setExpanded = async (item: Item, expand: boolean): Promise<void> => {
    if (!this.isItemExpandable(item) || !this.props.isRegionLoaded) {
      return;
    }
    if (expand) {
      this.expandedPaths.add(item.path);
    } else {
      this.expandedPaths.delete(item.path);
    }
    this.forceUpdate();

    if (!expand) {
      return;
    }

    if (item.type === "getter" && item.valueItem) {
      item = item.valueItem;
    }
    if (item.type === "value" && item.needsToLoadChildren()) {
      try {
        await loadChildren(item);
      } catch {
        this.expandedPaths.delete(item.path);
      }
      this.forceUpdate();
    }
  };

  expand = (item: Item): Promise<void> => this.setExpanded(item, true);

  collapse = (item: Item): Promise<void> => this.setExpanded(item, false);

  focusItem = (item: Item | undefined): void => {
    const { focusable = true, onFocus } = this.props;

    if (focusable && this.focusedItem?.path !== item?.path) {
      this.focusedItem = item;
      this.forceUpdate();

      if (onFocus) {
        onFocus(item);
      }
    }
  };

  activateItem = (item: Item | undefined): void => {
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
        isExpandable={this.isItemExpandable}
        focused={this.focusedItem}
        active={this.activeItem}
        getRoots={this.getRoots}
        getParent={() => undefined}
        getChildren={this.getItemChildren}
        areItemsEqual={this.areItemsEqual}
        shouldItemUpdate={this.shouldItemUpdate}
        getKey={this.getItemKey}
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
              forceUpdate: () => this.forceUpdate(),
            }}
          />
        )}
      />
    );
  }
}

function ObjectInspector(props: ObjectInspectorProps) {
  const roots = props.roots instanceof Function ? props.roots() : props.roots;

  if (roots.length == 0) {
    return null;
  }

  if (shouldRenderRootsInReps(roots)) {
    const root = roots[0];
    assert(root instanceof ValueItem, "OI root item must be a ValueItem");
    return <RedactedSpan>{renderRep(root, props)}</RedactedSpan>;
  }

  return (
    <RedactedSpan>
      <OI {...props} />
    </RedactedSpan>
  );
}

const connector = connect((state: UIState, props: PropsFromParent) => {
  const roots = props.roots instanceof Function ? props.roots() : props.roots;
  return {
    isRegionLoaded: isRegionLoaded(state, findPause(roots)?.time),
  };
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ObjectInspector);
