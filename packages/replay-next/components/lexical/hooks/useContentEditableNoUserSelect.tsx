import assert from "assert";
import { RefObject, useEffect } from "react";

export function useContentEditableNoUserSelect(
  rootElementRef: RefObject<HTMLElement>,
  options: {
    autoFocus: boolean;
    disableSelectionWhenNotFocused: boolean;
  }
) {
  const { autoFocus, disableSelectionWhenNotFocused } = options;

  useEffect(() => {
    if (!disableSelectionWhenNotFocused) {
      return;
    }

    const rootElement = rootElementRef.current;
    assert(rootElement !== null, "Root element not found");

    const contentEditableElement = rootElement.querySelector("[contenteditable]") as HTMLElement;
    if (contentEditableElement == null) {
      console.warn("No contenteditable element found in root element");
      return;
    }

    const disable = () => {
      rootElement.setAttribute("tabindex", "0");

      contentEditableElement.setAttribute("contenteditable", "false");
      contentEditableElement.style.userSelect = "none";
    };

    const enable = () => {
      // On tab-out (e.g. SHIFT+TAB) the parent should not steal focus and return it to the contenteditable
      rootElement.removeAttribute("tabindex");

      contentEditableElement.setAttribute("contenteditable", "true");
      contentEditableElement.style.userSelect = "";
    };

    const onRootElementFocus = () => {
      enable();

      contentEditableElement.focus();
    };

    const onContentEditableFocus = () => {
      if (contentEditableElement.getAttribute("contenteditable") !== "true") {
        rootElement.focus();
      }
    };

    const onContentEditableMouseDown = () => {
      rootElement.removeAttribute("tabindex");

      enable();
    };

    const onContentEditableBlur = () => {
      disable();
    };

    rootElement.addEventListener("focus", onRootElementFocus);

    contentEditableElement.addEventListener("blur", onContentEditableBlur);
    contentEditableElement.addEventListener("focus", onContentEditableFocus);
    contentEditableElement.addEventListener("mousedown", onContentEditableMouseDown);

    // HACK Give Lexical plug-in time to run before we check if the element has been (programmatically) focused
    // else we may disable the "contenteditable" attribute only to have Lexical re-enable it
    setTimeout(() => {
      if (!autoFocus && document.activeElement !== contentEditableElement) {
        disable();
      }
    });

    return () => {
      rootElement.removeEventListener("focus", onRootElementFocus);

      contentEditableElement.removeEventListener("blur", onContentEditableBlur);
      contentEditableElement.removeEventListener("focus", onContentEditableFocus);
      contentEditableElement.removeEventListener("mousedown", onContentEditableMouseDown);
    };
  }, [autoFocus, disableSelectionWhenNotFocused, rootElementRef]);
}
