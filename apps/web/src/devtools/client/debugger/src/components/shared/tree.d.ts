import { Component, ReactNode } from "react";

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

export class Tree<T> extends Component<TreeProps<T>> {}
