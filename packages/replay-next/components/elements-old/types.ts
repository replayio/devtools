import { Node, ObjectId } from "@replayio/protocol";

import { Element } from "replay-next/components/elements-old/suspense/ElementCache";

export type Item = {
  // We can't render an element until it's immediate children have been fetched
  // because we have to filter out things like empty #text nodes
  // Because of this, an element's children can't be rendered until their immediate children have been fetched
  // If an element like this is expanded, it should render a "Loading..." placeholder instead of children
  childrenCanBeRendered: boolean;
  depth: number;
  element: Element;
  id: ObjectId;
  isExpanded: boolean;
  isTail: boolean;
};

export type Metadata = {
  childrenCanBeRendered: boolean;
  depth: number;
  element: Element;
  hasTail: boolean;
  isExpanded: boolean;

  // Metadata used by ElementsListData to more efficiently traverse and render its tree
  subTreeIsFullyLoaded: boolean;
  subTreeWeight: number;
};
