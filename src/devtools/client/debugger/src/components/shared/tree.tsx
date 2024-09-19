/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import classnames from "classnames";
import PropTypes from "prop-types";
import React, { ReactNode } from "react";

export interface TreeProps<T> {
  getParent: (item: T) => T | undefined;
  getChildren: (item: T) => T[];
  areItemsEqual?: (item1: T, item2: T) => boolean;
  shouldItemUpdate?: (prevItem: T, nextItem: T) => boolean;
  renderItem: (
    item: T,
    depth: number,
    isFocused: boolean,
    arrow: ReactNode,
    isExpanded: boolean
  ) => ReactNode;
  getRoots: () => T[];
  getKey: (item: T) => string;
  isExpanded: (item: T) => boolean;
  focused?: T;
  onFocus?: (item: T | undefined) => void;
  autoExpandDepth?: number;
  autoExpandAll?: boolean;
  autoExpandNodeChildrenLimit?: number;
  initiallyExpanded?: (item: T) => boolean;
  labelledby?: string;
  label?: string;
  onExpand?: (item: T) => void;
  onCollapse?: (item: T) => void;
  active?: T;
  onActivate?: (item: T | undefined) => void;
  isExpandable?: (item: T) => boolean;
  className?: string;
  style?: React.CSSProperties;
  preventBlur?: boolean;
}

interface TreeState {
  autoExpanded: Set<string>;
}

interface DFSTraversalEntry {
  item: any;
  depth: number;
}

// depth
const AUTO_EXPAND_DEPTH = 0;

// Simplied selector targetting elements that can receive the focus,
// full version at https://stackoverflow.com/questions/1599660.
const FOCUSABLE_SELECTOR = [
  "a[href]:not([tabindex='-1'])",
  "button:not([disabled]):not([tabindex='-1'])",
  "iframe:not([tabindex='-1'])",
  "input:not([disabled]):not([tabindex='-1'])",
  "select:not([disabled]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([tabindex='-1'])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

/**
 * An arrow that displays whether its node is expanded (▼) or collapsed
 * (▶). When its node has no children, it is hidden.
 */
function ArrowExpander({ expanded }: { expanded: boolean }) {
  return <button className={classnames("arrow", { expanded })} />;
}

const INDENT_CHARACTER = "\u200B";
const treeIndent = <span className="tree-indent">{INDENT_CHARACTER}</span>;
const treeLastIndent = <span className="tree-indent tree-last-indent">{INDENT_CHARACTER}</span>;

interface TreeNodeProps<T> {
  id: string;
  index: number;
  depth: number;
  focused: boolean;
  active: boolean;
  expanded: boolean;
  item: T;
  isExpandable: boolean;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  areItemsEqual?: (a: T, b: T) => boolean;
  shouldItemUpdate?: (a: T, b: T) => boolean;
  renderItem: (
    item: T,
    depth: number,
    focused: boolean,
    arrow: React.ReactNode,
    expanded: boolean
  ) => React.ReactNode;
}

class TreeNode<T> extends React.Component<TreeNodeProps<T>> {
  static get propTypes() {
    return {
      id: PropTypes.any.isRequired,
      index: PropTypes.number.isRequired,
      depth: PropTypes.number.isRequired,
      focused: PropTypes.bool.isRequired,
      active: PropTypes.bool.isRequired,
      expanded: PropTypes.bool.isRequired,
      item: PropTypes.any.isRequired,
      isExpandable: PropTypes.bool.isRequired,
      onClick: PropTypes.func,
      areItemsEqual: PropTypes.func,
      shouldItemUpdate: PropTypes.func,
      renderItem: PropTypes.func.isRequired,
    };
  }

  treeNodeRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    // Make sure that none of the focusable elements inside the tree node
    // container are tabbable if the tree node is not active. If the tree node
    // is active and focus is outside its container, focus on the first
    // focusable element inside.
    const elms = this.getFocusableElements();
    if (this.props.active) {
      const doc = this.treeNodeRef.current!.ownerDocument;
      if (elms.length > 0 && !elms.includes(doc.activeElement as any)) {
        elms[0].focus();
      }
    } else {
      elms.forEach(elm => elm.setAttribute("tabindex", "-1"));
    }
  }

  shouldComponentUpdate(nextProps: TreeNodeProps<T>) {
    return (
      !this._areItemsEqual(this.props.item, nextProps.item) ||
      (this.props.shouldItemUpdate &&
        this.props.shouldItemUpdate(this.props.item, nextProps.item)) ||
      this.props.focused !== nextProps.focused ||
      this.props.expanded !== nextProps.expanded
    );
  }

  _areItemsEqual(prevItem: any, nextItem: any) {
    if (this.props.areItemsEqual && prevItem && nextItem) {
      return this.props.areItemsEqual(prevItem, nextItem);
    } else {
      return prevItem === nextItem;
    }
  }

  /**
   * Get a list of all elements that are focusable with a keyboard inside the
   * tree node.
   */
  getFocusableElements() {
    return this.treeNodeRef.current
      ? (Array.from(this.treeNodeRef.current.querySelectorAll(FOCUSABLE_SELECTOR)) as HTMLElement[])
      : [];
  }

  /**
   * Wrap and move keyboard focus to first/last focusable element inside the
   * tree node to prevent the focus from escaping the tree node boundaries.
   * element).
   *
   * @param  {DOMNode} current  currently focused element
   * @param  {Boolean} back     direction
   * @return {Boolean}          true there is a newly focused element.
   */
  _wrapMoveFocus(current: HTMLElement, back: boolean) {
    const elms = this.getFocusableElements();
    let next;

    if (elms.length === 0) {
      return false;
    }

    if (back) {
      if (elms.indexOf(current) === 0) {
        next = elms[elms.length - 1];
        next.focus();
      }
    } else if (elms.indexOf(current) === elms.length - 1) {
      next = elms[0];
      next.focus();
    }

    return !!next;
  }

  _onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    const { target, key, shiftKey } = e;

    if (key !== "Tab") {
      return;
    }

    const focusMoved = this._wrapMoveFocus(target as HTMLElement, shiftKey);
    if (focusMoved) {
      // Focus was moved to the begining/end of the list, so we need to prevent
      // the default focus change that would happen here.
      e.preventDefault();
    }

    e.stopPropagation();
  };

  render() {
    const { depth, id, item, focused, active, expanded, renderItem, isExpandable } = this.props;

    const arrow = isExpandable ? <ArrowExpander expanded={expanded} /> : null;

    let ariaExpanded;
    if (this.props.isExpandable) {
      ariaExpanded = false;
    }
    if (this.props.expanded) {
      ariaExpanded = true;
    }

    const indents: React.ReactNode[] = Array.from({ length: depth }, (_, i) => {
      if (i == depth - 1) {
        return treeLastIndent;
      }
      return treeIndent;
    });

    // Handle "needs keys" warnings for the indentation
    const items = indents
      .concat(renderItem(item, depth, focused, arrow, expanded))
      .map((element, i) => React.cloneElement(element as JSX.Element, { key: i }));

    return (
      <div
        id={id}
        className={`tree-node${focused ? " focused" : ""}${active ? " active" : ""}`}
        onClick={this.props.onClick}
        onKeyDownCapture={active ? this._onKeyDown : undefined}
        role="treeitem"
        ref={this.treeNodeRef}
        aria-level={depth + 1}
        aria-expanded={ariaExpanded}
        data-expandable={this.props.isExpandable}
      >
        {items}
      </div>
    );
  }
}

/**
 * A generic tree component. See propTypes for the public API.
 *
 * This tree component doesn't make any assumptions about the structure of your
 * tree data. Whether children are computed on demand, or stored in an array in
 * the parent's `_children` property, it doesn't matter. We only require the
 * implementation of `getChildren`, `getRoots`, `getParent`, and `isExpanded`
 * functions.
 *
 * This tree component is well tested and reliable. See the tests in ./tests
 * and its usage in the performance and memory panels in mozilla-central.
 *
 * This tree component doesn't make any assumptions about how to render items in
 * the tree. You provide a `renderItem` function, and this component will ensure
 * that only those items whose parents are expanded and which are visible in the
 * viewport are rendered. The `renderItem` function could render the items as a
 * "traditional" tree or as rows in a table or anything else. It doesn't
 * restrict you to only one certain kind of tree.
 *
 * The tree comes with basic styling for the indent, the arrow, as well as
 * hovered and focused styles which can be override in CSS.
 *
 * ### Example Usage
 *
 * Suppose we have some tree data where each item has this form:
 *
 *     {
 *       id: Number,
 *       label: String,
 *       parent: Item or null,
 *       children: Array of child items,
 *       expanded: bool,
 *     }
 *
 * Here is how we could render that data with this component:
 *
 *     class MyTree extends Component {
 *       static get propTypes() {
 *         // The root item of the tree, with the form described above.
 *         return {
 *           root: PropTypes.object.isRequired
 *         };
 *       },
 *
 *       render() {
 *         return Tree({
 *           itemHeight: 20, // px
 *
 *           getRoots: () => [this.props.root],
 *
 *           getParent: item => item.parent,
 *           getChildren: item => item.children,
 *           getKey: item => item.id,
 *           isExpanded: item => item.expanded,
 *
 *           renderItem: (item, depth, isFocused, arrow, isExpanded) => {
 *             let className = "my-tree-item";
 *             if (isFocused) {
 *               className += " focused";
 *             }
 *             return dom.div({
 *               className,
 *             },
 *               arrow,
 *               // And here is the label for this item.
 *               dom.span({ className: "my-tree-item-label" }, item.label)
 *             );
 *           },
 *
 *           onExpand: item => dispatchExpandActionToRedux(item),
 *           onCollapse: item => dispatchCollapseActionToRedux(item),
 *         });
 *       }
 *     }
 */
export class Tree<T> extends React.Component<TreeProps<T>, TreeState> {
  static get propTypes() {
    return {
      // Required props

      // A function to get an item's parent, or null if it is a root.
      //
      // Type: getParent(item: Item) -> Maybe<Item>
      //
      // Example:
      //
      //     // The parent of this item is stored in its `parent` property.
      //     getParent: item => item.parent
      getParent: PropTypes.func.isRequired,

      // A function to get an item's children.
      //
      // Type: getChildren(item: Item) -> [Item]
      //
      // Example:
      //
      //     // This item's children are stored in its `children` property.
      //     getChildren: item => item.children
      getChildren: PropTypes.func.isRequired,

      // A function to check if two items represent the same tree node.
      // Use this if the item representing a tree node may be replaced by
      // a new item and you don't want to rerender that node every time
      // the item is replaced. Use shouldItemUpdate() to control when the
      // node should be updated.
      //
      // Type: areItemsEqual(prevItem: Item, nextItem: Item) -> Boolean
      areItemsEqual: PropTypes.func,

      // A function to check if the tree node for the item should be updated.
      //
      // Type: shouldItemUpdate(prevItem: Item, nextItem: Item) -> Boolean
      //
      // Example:
      //
      //     // This item should be updated if it's type is a long string
      //     shouldItemUpdate: (prevItem, nextItem) =>
      //       nextItem.type === "longstring"
      shouldItemUpdate: PropTypes.func,

      // A function which takes an item and ArrowExpander component instance and
      // returns a component, or text, or anything else that React considers
      // renderable.
      //
      // Type: renderItem(item: Item,
      //                  depth: Number,
      //                  isFocused: Boolean,
      //                  arrow: ReactComponent,
      //                  isExpanded: Boolean) -> ReactRenderable
      //
      // Example:
      //
      //     renderItem: (item, depth, isFocused, arrow, isExpanded) => {
      //       let className = "my-tree-item";
      //       if (isFocused) {
      //         className += " focused";
      //       }
      //       return dom.div(
      //         {
      //           className,
      //           style: { marginLeft: depth * 10 + "px" }
      //         },
      //         arrow,
      //         dom.span({ className: "my-tree-item-label" }, item.label)
      //       );
      //     },
      renderItem: PropTypes.func.isRequired,

      // A function which returns the roots of the tree (forest).
      //
      // Type: getRoots() -> [Item]
      //
      // Example:
      //
      //     // In this case, we only have one top level, root item. You could
      //     // return multiple items if you have many top level items in your
      //     // tree.
      //     getRoots: () => [this.props.rootOfMyTree]
      getRoots: PropTypes.func.isRequired,

      // A function to get a unique key for the given item. This helps speed up
      // React's rendering a *TON*.
      //
      // Type: getKey(item: Item) -> String
      //
      // Example:
      //
      //     getKey: item => `my-tree-item-${item.uniqueId}`
      getKey: PropTypes.func.isRequired,

      // A function to get whether an item is expanded or not. If an item is not
      // expanded, then it must be collapsed.
      //
      // Type: isExpanded(item: Item) -> Boolean
      //
      // Example:
      //
      //     isExpanded: item => item.expanded,
      isExpanded: PropTypes.func.isRequired,

      // Optional props

      // The currently focused item, if any such item exists.
      focused: PropTypes.any,

      // Handle when a new item is focused.
      onFocus: PropTypes.func,

      // The depth to which we should automatically expand new items.
      autoExpandDepth: PropTypes.number,
      // Should auto expand all new items or just the new items under the first
      // root item.
      autoExpandAll: PropTypes.bool,

      // Auto expand a node only if number of its children
      // are less than autoExpandNodeChildrenLimit
      autoExpandNodeChildrenLimit: PropTypes.number,

      // Note: the two properties below are mutually exclusive. Only one of the
      // label properties is necessary.
      // ID of an element whose textual content serves as an accessible label
      // for a tree.
      labelledby: PropTypes.string,
      // Accessibility label for a tree widget.
      label: PropTypes.string,

      // Optional event handlers for when items are expanded or collapsed.
      // Useful for dispatching redux events and updating application state,
      // maybe lazily loading subtrees from a worker, etc.
      //
      // Type:
      //     onExpand(item: Item)
      //     onCollapse(item: Item)
      //
      // Example:
      //
      //     onExpand: item => dispatchExpandActionToRedux(item)
      onExpand: PropTypes.func,
      onCollapse: PropTypes.func,
      // The currently active (keyboard) item, if any such item exists.
      active: PropTypes.any,
      // Optional event handler called with the current focused node when the
      // Enter key is pressed. Can be useful to allow further keyboard actions
      // within the tree node.
      onActivate: PropTypes.func,
      isExpandable: PropTypes.func,
      // Additional classes to add to the root element.
      className: PropTypes.string,
      // style object to be applied to the root element.
      style: PropTypes.object,
      // Prevents blur when Tree loses focus
      preventBlur: PropTypes.bool,
    };
  }

  static get defaultProps() {
    return {
      autoExpandDepth: AUTO_EXPAND_DEPTH,
      autoExpandAll: true,
    };
  }

  state: TreeState = {
    autoExpanded: new Set<string>(),
  };

  treeRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this._autoExpand();
    if (this.props.focused) {
      this._scrollNodeIntoView(this.props.focused);
    }
  }

  UNSAFE_componentWillReceiveProps() {
    this._autoExpand();
  }

  componentDidUpdate(prevProps: TreeProps<T>) {
    if (this.props.focused && !this._areItemsEqual(prevProps.focused, this.props.focused)) {
      this._scrollNodeIntoView(this.props.focused);
    }
  }

  _areItemsEqual = (prevItem: any, nextItem: any) => {
    if (this.props.areItemsEqual && prevItem && nextItem) {
      return this.props.areItemsEqual(prevItem, nextItem);
    } else {
      return prevItem === nextItem;
    }
  };

  _autoExpand = () => {
    const { autoExpandDepth, autoExpandNodeChildrenLimit, initiallyExpanded } = this.props;

    if (!autoExpandDepth && !initiallyExpanded) {
      return;
    }

    // Automatically expand the first autoExpandDepth levels for new items. Do
    // not use the usual DFS infrastructure because we don't want to ignore
    // collapsed nodes. Any initially expanded items will be expanded regardless
    // of how deep they are.
    const autoExpand = (item: any, currentDepth: number) => {
      const initial = initiallyExpanded && initiallyExpanded(item);

      if (!initial && currentDepth >= autoExpandDepth!) {
        return;
      }

      const children = this.props.getChildren(item);
      if (
        !initial &&
        autoExpandNodeChildrenLimit &&
        children.length > autoExpandNodeChildrenLimit
      ) {
        return;
      }

      if (!this.state.autoExpanded.has(item)) {
        this.props.onExpand?.(item);
        this.state.autoExpanded.add(item);
      }

      const length = children.length;
      for (let i = 0; i < length; i++) {
        autoExpand(children[i], currentDepth + 1);
      }
    };

    const roots = this.props.getRoots();
    const length = roots.length;
    if (this.props.autoExpandAll) {
      for (let i = 0; i < length; i++) {
        autoExpand(roots[i], 0);
      }
    } else if (length != 0) {
      autoExpand(roots[0], 0);

      if (initiallyExpanded) {
        for (let i = 1; i < length; i++) {
          if (initiallyExpanded(roots[i])) {
            autoExpand(roots[i], 0);
          }
        }
      }
    }
  };

  _preventArrowKeyScrolling = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
      case "ArrowDown":
      case "ArrowLeft":
      case "ArrowRight":
        this._preventEvent(e);
        break;
    }
  };

  _preventEvent(e: React.KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent) {
      if (e.nativeEvent.preventDefault) {
        e.nativeEvent.preventDefault();
      }
      if (e.nativeEvent.stopPropagation) {
        e.nativeEvent.stopPropagation();
      }
    }
  }

  /**
   * Perform a pre-order depth-first search from item.
   */
  _dfs(item: any, maxDepth = Infinity, traversal: DFSTraversalEntry[] = [], _depth = 0) {
    traversal.push({ item, depth: _depth });

    if (!this.props.isExpanded(item)) {
      return traversal;
    }

    const nextDepth = _depth + 1;

    if (nextDepth > maxDepth) {
      return traversal;
    }

    const children = this.props.getChildren(item);
    const length = children.length;
    for (let i = 0; i < length; i++) {
      this._dfs(children[i], maxDepth, traversal, nextDepth);
    }

    return traversal;
  }

  /**
   * Perform a pre-order depth-first search over the whole forest.
   */
  _dfsFromRoots(maxDepth = Infinity) {
    const traversal: DFSTraversalEntry[] = [];

    const roots = this.props.getRoots();
    const length = roots.length;
    for (let i = 0; i < length; i++) {
      this._dfs(roots[i], maxDepth, traversal);
    }

    return traversal;
  }

  /**
   * Expands current row.
   *
   * @param {Object} item
   * @param {Boolean} expandAllChildren
   */
  _onExpand = (item: any, expandAllChildren?: boolean) => {
    if (this.props.onExpand) {
      this.props.onExpand(item);

      if (expandAllChildren) {
        const children = this._dfs(item);
        const length = children.length;
        for (let i = 0; i < length; i++) {
          this.props.onExpand(children[i].item);
        }
      }
    }
  };

  /**
   * Collapses current row.
   *
   * @param {Object} item
   */
  _onCollapse = (item: any) => {
    if (this.props.onCollapse) {
      this.props.onCollapse(item);
    }
  };

  /**
   * Sets the passed in item to be the focused item.
   *
   * @param {Object|undefined} item
   *        The item to be focused, or undefined to focus no item.
   */
  _focus = (item: any, options: { preventAutoScroll?: boolean } = {}) => {
    const { preventAutoScroll } = options;
    if (item && !preventAutoScroll) {
      this._scrollNodeIntoView(item);
    }

    if (this.props.active != undefined) {
      this._activate(undefined);
      const doc = this.treeRef.current && this.treeRef.current.ownerDocument;
      if (this.treeRef.current !== doc?.activeElement) {
        this.treeRef.current!.focus();
      }
    }

    if (this.props.onFocus) {
      this.props.onFocus(item);
    }
  };

  /**
   * Sets the passed in item to be the active item.
   *
   * @param {Object|undefined} item
   *        The item to be activated, or undefined to activate no item.
   */
  _activate = (item: any) => {
    if (this.props.onActivate) {
      this.props.onActivate(item);
    }
  };

  /**
   * Sets the passed in item to be the focused item.
   *
   * @param {Object|undefined} item
   *        The item to be scrolled to.
   *
   * @param {Object|undefined} options
   *        An options object which can contain:
   *          - dir: "up" or "down" to indicate if we should scroll the element
   *                 to the top or the bottom of the scrollable container when
   *                 the element is off canvas.
   */
  _scrollNodeIntoView = (item: any) => {
    if (item !== undefined) {
      const treeElement = this.treeRef.current;
      const doc = treeElement && treeElement.ownerDocument;
      const element = doc?.getElementById(this.props.getKey(item));

      if (element) {
        const { top, bottom } = element.getBoundingClientRect();
        const closestScrolledParent = (node: HTMLElement | null): HTMLElement | null => {
          if (node == null) {
            return null;
          }

          if (node.scrollHeight > node.clientHeight) {
            return node;
          }
          return closestScrolledParent(node.parentNode as HTMLElement);
        };

        const scrolledParentRect = treeElement?.getBoundingClientRect();
        const isVisible =
          !treeElement || (top >= scrolledParentRect!.top && bottom <= scrolledParentRect!.bottom);

        if (isVisible) {
          return;
        }

        element.scrollIntoView({ block: "center" });
      }
    }
  };

  /**
   * Sets the state to have no focused item.
   */
  _onBlur = (e: React.FocusEvent<HTMLElement>) => {
    if (this.props.active != undefined) {
      const { relatedTarget } = e;
      if (!this.treeRef.current!.contains(relatedTarget as any)) {
        this._activate(undefined);
      }
    } else if (!this.props.preventBlur) {
      this._focus(undefined);
    }
  };

  /**
   * Handles key down events in the tree's container.
   *
   * @param {Event} e
   */
  // eslint-disable-next-line complexity
  _onKeyDown = (e: React.KeyboardEvent) => {
    if (this.props.focused == null) {
      return;
    }

    // Allow parent nodes to use navigation arrows with modifiers.
    if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) {
      return;
    }

    this._preventArrowKeyScrolling(e);
    const doc = this.treeRef.current && this.treeRef.current.ownerDocument;

    switch (e.key) {
      case "ArrowUp":
        this._focusPrevNode();
        return;

      case "ArrowDown":
        this._focusNextNode();
        return;

      case "ArrowLeft":
        if (
          this.props.isExpanded(this.props.focused) &&
          this._nodeIsExpandable(this.props.focused)
        ) {
          this._onCollapse(this.props.focused);
        } else {
          this._focusParentNode();
        }
        return;

      case "ArrowRight":
        if (
          this._nodeIsExpandable(this.props.focused) &&
          !this.props.isExpanded(this.props.focused)
        ) {
          this._onExpand(this.props.focused);
        } else {
          this._focusNextNode();
        }
        return;

      case "Home":
        this._focusFirstNode();
        return;

      case "End":
        this._focusLastNode();
        return;

      case "Enter":
      case "NumpadEnter":
      case " ":
        if (this.treeRef.current === doc!.activeElement) {
          this._preventEvent(e);
          if (!this._areItemsEqual(this.props.active, this.props.focused)) {
            this._activate(this.props.focused);
          }
        }
        return;

      case "Escape":
        this._preventEvent(e);
        if (this.props.active != undefined) {
          this._activate(undefined);
        }

        if (this.treeRef.current !== doc!.activeElement) {
          this.treeRef.current!.focus();
        }
    }
  };

  /**
   * Sets the previous node relative to the currently focused item, to focused.
   */
  _focusPrevNode = () => {
    // Start a depth first search and keep going until we reach the currently
    // focused node. Focus the previous node in the DFS, if it exists. If it
    // doesn't exist, we're at the first node already.

    let prev;

    const traversal = this._dfsFromRoots();
    const length = traversal.length;
    for (let i = 0; i < length; i++) {
      const item = traversal[i].item;
      if (this._areItemsEqual(item, this.props.focused)) {
        break;
      }
      prev = item;
    }
    if (prev === undefined) {
      return;
    }

    this._focus(prev);
  };

  /**
   * Handles the down arrow key which will focus either the next child
   * or sibling row.
   */
  _focusNextNode = () => {
    // Start a depth first search and keep going until we reach the currently
    // focused node. Focus the next node in the DFS, if it exists. If it
    // doesn't exist, we're at the last node already.
    const traversal = this._dfsFromRoots();
    const length = traversal.length;
    let i = 0;

    while (i < length) {
      if (this._areItemsEqual(traversal[i].item, this.props.focused)) {
        break;
      }
      i++;
    }

    if (i + 1 < traversal.length) {
      this._focus(traversal[i + 1].item);
    }
  };

  /**
   * Handles the left arrow key, going back up to the current rows'
   * parent row.
   */
  _focusParentNode = () => {
    const parent = this.props.getParent(this.props.focused!);
    if (!parent) {
      this._focusPrevNode();
      return;
    }

    this._focus(parent);
  };

  _focusFirstNode = () => {
    const traversal = this._dfsFromRoots();
    this._focus(traversal[0].item);
  };

  _focusLastNode = () => {
    const traversal = this._dfsFromRoots();
    const lastIndex = traversal.length - 1;
    this._focus(traversal[lastIndex].item);
  };

  _nodeIsExpandable = (item: any) => {
    return this.props.isExpandable
      ? this.props.isExpandable(item)
      : !!this.props.getChildren(item).length;
  };

  render() {
    const traversal = this._dfsFromRoots();
    const { active, focused } = this.props;

    const seenKeys = new Set<string>();

    const nodes: JSX.Element[] = [];
    traversal.forEach((v, i) => {
      const { item, depth } = v;
      const key = this.props.getKey(item);
      if (seenKeys.has(key)) {
        return;
      }
      seenKeys.add(key);
      nodes.push(
        <TreeNode<any>
          // We make a key unique depending on whether the tree node is in active
          // or inactive state to make sure that it is actually replaced and the
          // tabbable state is reset.
          key={`${key}-${this._areItemsEqual(active, item) ? "active" : "inactive"}`}
          id={key}
          index={i}
          item={item}
          depth={depth}
          areItemsEqual={this.props.areItemsEqual}
          shouldItemUpdate={this.props.shouldItemUpdate}
          renderItem={this.props.renderItem}
          focused={this._areItemsEqual(focused, item)}
          active={this._areItemsEqual(active, item)}
          expanded={this.props.isExpanded(item)}
          isExpandable={this._nodeIsExpandable(item)}
          onClick={(e: React.MouseEvent) => {
            // We can stop the propagation since click handler on the node can be
            // created in `renderItem`.
            e.stopPropagation();

            if (e.defaultPrevented) {
              return;
            }

            // Since the user just clicked the node, there's no need to check if
            // it should be scrolled into view.
            this._focus(item, { preventAutoScroll: true });
            if (this.props.isExpanded(item)) {
              this.props.onCollapse?.(item);
            } else {
              this.props.onExpand?.(item);
            }

            // Focus should always remain on the tree container itself.
            this.treeRef.current!.focus();
          }}
        />
      );
    });
    const style = Object.assign({}, this.props.style || {});

    return (
      <div
        className={`tree ${this.props.className ? this.props.className : ""}`}
        ref={this.treeRef}
        role="tree"
        tabIndex={0}
        onKeyDown={this._onKeyDown}
        onKeyPress={this._preventArrowKeyScrolling}
        onKeyUp={this._preventArrowKeyScrolling}
        onFocus={({ nativeEvent }: React.FocusEvent) => {
          if (focused || !nativeEvent || !this.treeRef.current) {
            return;
          }

          // @ts-expect-error
          const { explicitOriginalTarget } = nativeEvent;
          // Only set default focus to the first tree node if the focus came
          // from outside the tree (e.g. by tabbing to the tree from other
          // external elements).
          if (
            explicitOriginalTarget !== this.treeRef.current &&
            !this.treeRef.current.contains(explicitOriginalTarget)
          ) {
            this._focus(traversal[0].item);
          }
        }}
        onBlur={this._onBlur}
        aria-label={this.props.label}
        aria-labelledby={this.props.labelledby}
        aria-activedescendant={focused && this.props.getKey(focused)}
        style={style}
      >
        {nodes}
      </div>
    );
  }
}
