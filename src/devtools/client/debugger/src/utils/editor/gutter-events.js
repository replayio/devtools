import { trackEvent } from "ui/utils/telemetry";
import { safeJsonParse, getLineNumberNode, dispatch } from "./line-events";

function isValidTarget(target) {
  return !!target.closest(".CodeMirror-gutter-wrapper");
}

export function onGutterMouseOver(codeMirror) {
  return event => {
    const { target } = event;

    if (!isValidTarget(target)) {
      return;
    }

    trackEvent("editor.gutter_mouse_over");

    const row = target.closest(".CodeMirror-gutter-wrapper").parentElement;
    const lineNumberNode = getLineNumberNode(row);
    const lineNumber = safeJsonParse(lineNumberNode.textContent);

    target.addEventListener(
      "mouseleave",
      event => {
        dispatch(codeMirror, "gutterMouseLeave", { lineNumberNode, lineNumber });
      },
      {
        capture: true,
        once: true,
      }
    );

    dispatch(codeMirror, "gutterMouseEnter", { lineNumberNode, lineNumber });
  };
}
