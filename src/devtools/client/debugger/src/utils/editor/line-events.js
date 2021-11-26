import { trackEventOnce } from "ui/utils/mixpanel";
import { trackEvent } from "ui/utils/telemetry";

function dispatch(codeMirror, eventName, data) {
  codeMirror.constructor.signal(codeMirror, eventName, data);
}

function safeJsonParse(text) {
  let parsedJson;

  try {
    parsedJson = JSON.parse(text);
  } catch (e) {
    console.error("Error while parsing text", text, e);
    throw Error(e);
  }

  return parsedJson;
}

const getLineNumberNode = target => target.querySelector(".CodeMirror-linenumber");
const isHoveredOnLineGutter = target => target.closest(".CodeMirror-gutter-wrapper");

function isValidTarget(target) {
  const isCodeMirrorBody = target.closest(".CodeMirror-code");
  const isWidget = target.closest(".CodeMirror-linewidget");
  const isNonBreakableLineNode = target.closest(".empty-line");
  const isTooltip = target.closest(".static-tooltip");

  return isCodeMirrorBody && !isWidget && !isNonBreakableLineNode && !isTooltip;
}

function emitGutterMouseEnter(codeMirror, target) {
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
}

function emitLineMouseEnter(codeMirror, target) {
  trackEventOnce("editor.mouse_over");

  const row =
    target.closest(".CodeMirror-line")?.parentElement ||
    target.closest(".CodeMirror-gutter-wrapper")?.parentElement;
  const lineNumberNode = getLineNumberNode(row);
  const lineNumber = safeJsonParse(lineNumberNode.textContent);

  target.addEventListener(
    "mouseleave",
    event => dispatch(codeMirror, "lineMouseLeave", { lineNumberNode, lineNumber }),
    {
      capture: true,
      once: true,
    }
  );

  dispatch(codeMirror, "lineMouseEnter", { lineNumberNode, lineNumber });
}

export function onLineMouseOver(codeMirror) {
  return event => {
    let { target } = event;

    if (!isValidTarget(target)) {
      return;
    }

    if (isHoveredOnLineGutter(target)) {
      emitGutterMouseEnter(codeMirror, target);
    }

    emitLineMouseEnter(codeMirror, target);
  };
}
