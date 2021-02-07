/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

const { PureComponent, Component, createFactory, createElement } = require("react");
const { connect } = require("react-redux");

import { Tree as _Tree } from "devtools/client/debugger/src/components/shared/tree";
const Tree = createFactory(_Tree);
require("./ObjectInspector.css");

const ObjectInspectorItem = createFactory(require("./ObjectInspectorItem").default);

const classnames = require("classnames");

const Utils = require("../utils");
const { renderRep, shouldRenderRootsInReps } = Utils;
const {
  getChildren,
  getActor,
  getParent,
  getValue,
  nodeIsPrimitive,
  nodeHasGetter,
  nodeHasSetter,
} = Utils.node;

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

class ObjectInspector extends PureComponent {
  static defaultProps;

  state = {
    expandedPaths: new Set(),
    loadedProperties: new Map(),
  };

  constructor(props) {
    super();
    this.cachedNodes = new Map();

    const self = this;

    self.isNodeExpandable = this.isNodeExpandable.bind(this);
    self.focusItem = this.focusItem.bind(this);
    self.activateItem = this.activateItem.bind(this);
    self.getRoots = this.getRoots.bind(this);
    self.getNodeKey = this.getNodeKey.bind(this);
    self.shouldItemUpdate = this.shouldItemUpdate.bind(this);
  }

  UNSAFE_componentWillMount() {
    this.roots = this.props.roots;
    this.focusedItem = this.props.focusedItem;
    this.activeItem = this.props.activeItem;
  }

  // shouldComponentUpdate(nextProps) {
  //   // We should update if:

  //   // - OR the focused node changed.
  //   // - OR the active node changed.
  //   return this.focusedItem !== nextProps.focusedItem || this.activeItem !== nextProps.activeItem;
  // }

  componentWillUnmount() {}

  props;
  cachedNodes;

  getItemChildren = item => {
    if (this.cachedNodes.has(item.path)) {
      const children = this.cachedNodes.get(item.path);
      return children;
    }

    const children = getChildren({ item });
    this.cachedNodes.set(item.path, children);
    return children;
  };

  getRoots() {
    return this.props.roots;
  }

  getNodeKey(item) {
    return item.path && typeof item.path.toString === "function"
      ? item.path.toString()
      : item.contents.id();
  }

  isNodeExpandable(item) {
    if (nodeIsPrimitive(item)) {
      return false;
    }

    if (nodeHasSetter(item) || nodeHasGetter(item)) {
      return false;
    }

    return true;
  }

  setExpanded = (item, expand) => {
    const { expandedPaths, loadedProperties } = this.state;
    if (!this.isNodeExpandable(item)) {
      return;
    }
    if (expand) {
      expandedPaths.add(item.path);
    } else {
      expandedPaths.delete(item.path);
    }

    this.setState({ expandedPaths });

    if (!loadedProperties.has(item.path)) {
      getValue(item)
        .loadChildren()
        .then(children => {
          loadedProperties.set(item.path, children);
          this.setState({ loadedProperties });
        });
    }
  };

  focusItem(item) {
    const { focusable = true, onFocus } = this.props;

    if (focusable && this.focusedItem !== item) {
      this.focusedItem = item;
      this.forceUpdate();

      if (onFocus) {
        onFocus(item);
      }
    }
  }

  activateItem(item) {
    const { focusable = true, onActivate } = this.props;

    if (focusable && this.activeItem !== item) {
      this.activeItem = item;
      this.forceUpdate();

      if (onActivate) {
        onActivate(item);
      }
    }
  }

  shouldItemUpdate(prevItem, nextItem) {
    return false;
  }

  render() {
    const { focusable = true, disableWrap = false, inline } = this.props;
    const { expandedPaths } = this.state;

    return Tree({
      className: classnames({
        inline,
        nowrap: disableWrap,
        "object-inspector": true,
      }),

      isExpanded: item => expandedPaths.has(item.path),
      isExpandable: this.isNodeExpandable,
      focused: this.focusedItem,
      active: this.activeItem,

      getRoots: this.getRoots,
      getParent,
      getChildren: this.getItemChildren,
      getKey: this.getNodeKey,

      onExpand: item => this.setExpanded(item, true),
      onCollapse: item => this.setExpanded(item, false),
      onFocus: focusable ? this.focusItem : null,
      onActivate: focusable ? this.activateItem : null,

      shouldItemUpdate: this.shouldItemUpdate,
      renderItem: (item, depth, focused, arrow, expanded) =>
        ObjectInspectorItem({
          ...this.props,
          item,
          depth,
          focused,
          arrow,
          expanded,
          setExpanded: this.setExpanded,
        }),
    });
  }
}

// eslint-disable-next-line
export default props => {
  const { roots } = props;

  if (roots.length == 0) {
    return null;
  }

  if (shouldRenderRootsInReps(roots)) {
    return renderRep(roots[0], props);
  }

  return createElement(ObjectInspector, props);
};
