import { trackEventOnce } from "ui/utils/mixpanel";

export function dispatch(codeMirror, eventName, data) {
  codeMirror.constructor.signal(codeMirror, eventName, data);
}

export function safeJsonParse(text) {
  let parsedJson;

  try {
    parsedJson = JSON.parse(text);
  } catch (e) {
    console.error("Error while parsing text", text, e);
    throw Error(e);
  }

  return parsedJson;
}

export const getLineNumberNode = target => target.querySelector(".CodeMirror-linenumber");
const isHoveredOnLine = target => !!target.closest(".CodeMirror-line");

function isValidTarget(target) {
  const isNonBreakableLineNode = target.closest(".empty-line");
  const isTooltip = target.closest(".static-tooltip");

  return isHoveredOnLine(target) && !isNonBreakableLineNode && !isTooltip;
}

let _LAST_LINE_NUMBER = null;

function emitLineMouseEnter(codeMirror, target) {
  trackEventOnce("editor.mouse_over");

  const lineNode = target.closest(".CodeMirror-line");
  const row = lineNode.parentElement;

  const lineNumberNode = getLineNumberNode(row);
  const lineNumber = safeJsonParse(lineNumberNode.textContent);
  _LAST_LINE_NUMBER = lineNumber;

  lineNode.addEventListener(
    "mouseleave",
    event => {
      console.log({lineNumber, _LAST_LINE_NUMBER});
      if (lineNumber !== _LAST_LINE_NUMBER || !lineNumberNode.matches(":hover")) {
        dispatch(codeMirror, "lineMouseLeave", { lineNumber, lineNode, lineNumberNode })
      }
    },
    {
      capture: true,
      once: true,
    }
  );

  dispatch(codeMirror, "lineMouseEnter", { lineNumber, lineNode, lineNumberNode });
}

export function onLineMouseOver(codeMirror) {
  return event => {
    let target = event.target;

    // Hacky, try to fix this.
    if (target.closest(".CodeMirror-linewidget")) {
      target = target
        .closest(".CodeMirror-linewidget")
        .parentElement.querySelector(".CodeMirror-line");
    }

    if (isValidTarget(target)) {
      emitLineMouseEnter(codeMirror, target);
    }
  };
}
