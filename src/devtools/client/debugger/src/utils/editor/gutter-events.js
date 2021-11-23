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

function getLineNumberNode(target) {
  const row =
    target.closest(".CodeMirror-gutter-wrapper")?.parentElement ||
    target.closest(".CodeMirror-line")?.parentElement;

  return row.querySelector(".CodeMirror-linenumber");
}

function isValidTarget(target) {
  const isRow =
    target.closest(".CodeMirror-gutter-wrapper")?.parentElement ||
    target.closest(".CodeMirror-line")?.parentElement;
  const isWidget = target.closest(".CodeMirror-linewidget");
  const isNonBreakableLineNode = target.closest(".empty-line");
  const isTooltip = target.closest(".static-tooltip");

  return isRow && !isWidget && !isNonBreakableLineNode && !isTooltip;
}

export function onGutterMouseOver(codeMirror) {
  return event => {
    let { target } = event;

    if (!isValidTarget(target)) {
      return;
    }

    const lineNumberNode = getLineNumberNode(target);
    const lineNumber = safeJsonParse(lineNumberNode.textContent);

    target.addEventListener(
      "mouseleave",
      event => dispatch(codeMirror, "gutterLineLeave", { targetNode: lineNumberNode, lineNumber }),
      {
        capture: true,
        once: true,
      }
    );

    dispatch(codeMirror, "gutterLineEnter", { targetNode: lineNumberNode, lineNumber });
  };
}
