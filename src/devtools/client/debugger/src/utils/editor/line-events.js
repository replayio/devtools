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

  return isCodeMirrorBody && !isInWidget && !isNonBreakableLineNode && !isTooltip;
}

function emitGutterMouseEnter(codeMirror, target) {
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
  const row =
    target.closest(".CodeMirror-line")?.parentElement ||
    target.closest(".CodeMirror-gutter-wrapper")?.parentElement;
  const lineNumberNode = getLineNumberNode(row);
  const lineNumber = safeJsonParse(lineNumberNode.textContent);

  target.addEventListener(
    "mouseleave",
    event => dispatch(codeMirror, "lineLeave", { lineNumberNode, lineNumber }),
    {
      capture: true,
      once: true,
    }
  );

  dispatch(codeMirror, "lineEnter", { lineNumberNode, lineNumber });
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
