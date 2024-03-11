import { Metadata } from "replay-next/components/elements-old/types";

export function getItemWeight(metadata: Metadata): number {
  // Note that it's important to use subTreeWeight
  // because childNode may contained nodes that aren't displayed
  const { childrenCanBeRendered, element, hasTail, isExpanded, subTreeWeight } = metadata;

  const hasChildren = element.filteredChildNodeIds.length > 0;

  if (hasChildren) {
    if (isExpanded) {
      const headAndTailWeight = hasTail ? 2 : 1;

      if (childrenCanBeRendered) {
        // <ul>
        //   <li>…</li>
        //   <li>…</li>
        // </ul>
        return headAndTailWeight + subTreeWeight;
      } else {
        // <ul>
        //   Loading…
        // </ul>
        return headAndTailWeight + 1;
      }
    } else {
      // <ul>…</ul>
      return 1;
    }
  } else {
    // <ul />
    return 1;
  }
}
