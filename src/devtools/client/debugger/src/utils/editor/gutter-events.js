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
  const wrapper = target.closest(".CodeMirror-gutter-wrapper");
  return wrapper.querySelector(".CodeMirror-linenumber");
}

function isValidTarget(target) {
  const isGutterNode = target.closest(".CodeMirror-gutter-wrapper");

  if (!isGutterNode) {
    return false;
  }

  const isNonBreakableLineNode = target.closest(".empty-line");
  const isTooltip = target.closest(".static-tooltip");

  return !isNonBreakableLineNode && !isTooltip;
}

export function onGutterMouseOver(codeMirror) {
  return event => {
    let { target } = event;

    if (!isValidTarget(target)) {
      return;
    }

    const lineNumberNode = getLineNumberNode(target);
    const lineNumber = safeJsonParse(lineNumberNode.firstChild.textContent);

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
