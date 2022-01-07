import { useEffect } from "react";

function addHighlightToToken(target: HTMLElement) {
  target.classList.add("preview-token");
}

function removeHighlightFromToken(target: HTMLElement) {
  target.classList.remove("preview-token");
}

function addHighlightToTargetSiblings(target: HTMLElement, expression: string) {
  // This function searches for related tokens that should also be highlighted when previewed.
  // Here is the process:
  // It conducts a search on the target's next siblings and then another search for the previous siblings.
  // If a sibling is not an element node (nodeType === 1), the highlight is not added and the search is short-circuited.
  // If the element sibling is the same token type as the target, and is also found in the preview expression, the highlight class is added.

  const tokenType = target.classList.item(0);
  const previewExpression = expression;

  if (tokenType && previewExpression && target.innerHTML !== previewExpression) {
    let nextElementSibling = target.nextElementSibling;
    // Note: Declaring previous/next ELEMENT siblings as well because
    // properties like innerHTML can't be checked on nextSibling
    // without creating a flow error even if the node is an element type.
    while (
      nextElementSibling?.className.includes(tokenType) &&
      previewExpression.includes(nextElementSibling.innerHTML)
    ) {
      // All checks passed, add highlight and continue the search.
      nextElementSibling.classList.add("preview-token");

      nextElementSibling = nextElementSibling.nextElementSibling;
    }

    let previousElementSibling = target.previousElementSibling;

    while (
      previousElementSibling?.className.includes(tokenType) &&
      previewExpression?.includes(previousElementSibling.innerHTML)
    ) {
      // All checks passed, add highlight and continue the search.
      previousElementSibling.classList.add("preview-token");
      previousElementSibling = previousElementSibling.previousElementSibling;
    }
  }
}

function removeHighlightForTargetSiblings(target: HTMLElement) {
  // Look at target's previous and next token siblings.
  // If they also have the highlight class 'preview-token',
  // remove that class.
  let nextSibling = target.nextElementSibling;
  while (nextSibling?.className.includes("preview-token")) {
    nextSibling.classList.remove("preview-token");
    nextSibling = nextSibling.nextElementSibling;
  }
  let previousSibling = target.previousElementSibling;
  while (previousSibling?.className.includes("preview-token")) {
    previousSibling.classList.remove("preview-token");
    previousSibling = previousSibling.previousElementSibling;
  }
}

type PropTypes = {
  expression: string;
  target: HTMLElement;
};

// this could probably be a hook, but it's used in a Class Component at the moment
export const PreviewHighlight = ({ expression, target }: PropTypes) => {
  useEffect(() => {
    addHighlightToToken(target);
    return () => removeHighlightFromToken(target);
  }, [target]);

  useEffect(() => {
    addHighlightToTargetSiblings(target, expression);
    return () => removeHighlightForTargetSiblings(target);
  }, [expression, target]);

  return null;
};
