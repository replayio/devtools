/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// 

const { Component, createFactory, createElement } = require("react");
const { connect } = require("react-redux");
const actions = require("../actions");

const selectors = require("../reducer");

import Components from "devtools-components";
const Tree = createFactory(Components.Tree);
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

class ObjectInspector extends Component {
  static defaultProps;
  constructor(props) {
    super();
    this.cachedNodes = new Map();

    const self = this;

    self.getItemChildren = this.getItemChildren.bind(this);
    self.isNodeExpandable = this.isNodeExpandable.bind(this);
    self.setExpanded = this.setExpanded.bind(this);
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

  UNSAFE_componentWillUpdate(nextProps) {
    this.removeOutdatedNodesFromCache(nextProps);

    if (this.roots !== nextProps.roots) {
      // Since the roots changed, we assume the properties did as well,
      // so we need to cleanup the component internal state.
      this.roots = nextProps.roots;
      this.focusedItem = nextProps.focusedItem;
      this.activeItem = nextProps.activeItem;
      if (this.props.rootsChanged) {
        this.props.rootsChanged();
      }
    }
  }

  removeOutdatedNodesFromCache(nextProps) {
    // When the roots changes, we can wipe out everything.
    if (this.roots !== nextProps.roots) {
      this.cachedNodes.clear();
      return;
    }

    for (const [path, properties] of nextProps.loadedProperties) {
      if (properties !== this.props.loadedProperties.get(path)) {
        this.cachedNodes.delete(path);
      }
    }
  }

  shouldComponentUpdate(nextProps) {
    const { expandedPaths, loadedProperties } = this.props;

    // We should update if:
    // - there are new loaded properties
    // - OR the expanded paths number changed, and all of them have properties
    //      loaded
    // - OR the expanded paths number did not changed, but old and new sets
    //      differ
    // - OR the focused node changed.
    // - OR the active node changed.
    return (
      loadedProperties !== nextProps.loadedProperties ||
      loadedProperties.size !== nextProps.loadedProperties.size ||
      (expandedPaths.size !== nextProps.expandedPaths.size &&
        [...nextProps.expandedPaths].every(path => nextProps.loadedProperties.has(path))) ||
      (expandedPaths.size === nextProps.expandedPaths.size &&
        [...nextProps.expandedPaths].some(key => !expandedPaths.has(key))) ||
      this.focusedItem !== nextProps.focusedItem ||
      this.activeItem !== nextProps.activeItem ||
      this.roots !== nextProps.roots
    );
  }

  componentWillUnmount() {
    this.props.closeObjectInspector();
  }

  props;
  cachedNodes;

  getItemChildren(item) {
    const { loadedProperties } = this.props;
    const { cachedNodes } = this;

    return getChildren({
      loadedProperties,
      cachedNodes,
      item,
    });
  }

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

  setExpanded(item, expand) {
    if (!this.isNodeExpandable(item)) {
      return;
    }

    const { nodeExpand, nodeCollapse, setExpanded, roots } = this.props;

    if (expand === true) {
      nodeExpand(item);
    } else {
      nodeCollapse(item);
    }

    if (setExpanded) {
      setExpanded(item, expand);
    }
  }

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
    const {
      autoExpandAll = true,
      autoExpandDepth = 1,
      initiallyExpanded,
      focusable = true,
      disableWrap = false,
      expandedPaths,
      inline,
    } = this.props;

    return Tree({
      className: classnames({
        inline,
        nowrap: disableWrap,
        "object-inspector": true,
      }),

      autoExpandAll,
      autoExpandDepth,
      initiallyExpanded,
      isExpanded: item => expandedPaths && expandedPaths.has(item.path),
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

function mapStateToProps(state, props) {
  return {
    expandedPaths: selectors.getExpandedPaths(state),
    loadedProperties: selectors.getLoadedProperties(state),
  };
}

const OI = connect(mapStateToProps, actions)(ObjectInspector);

export default (props) => {
  const { roots } = props;

  if (roots.length == 0) {
    return null;
  }

  if (shouldRenderRootsInReps(roots)) {
    return renderRep(roots[0], props);
  }

  return createElement(OI, props);
};
