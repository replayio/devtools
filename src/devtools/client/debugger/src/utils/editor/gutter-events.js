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
  const isBreakpointMarkerNode = target.closest(".new-breakpoint");

  // If hovered on a breakpoint marker, get the corresponding linenumber element.
  if (isBreakpointMarkerNode) {
    const gutterNode = target.closest(".Codemirror-gutter-elt");
    target = gutterNode?.previousElementSibling;
  }

  return target;
}

function isValidTarget(target) {
  const isGutterNode = target.closest(".CodeMirror-gutter-wrapper");

  if (!isGutterNode) {
    return false;
  }

  const isBreakpointMarkerNode = target.closest(".new-breakpoint");
  const isLineNumberNode = target.closest(".CodeMirror-linenumber");
  const isNonBreakableLineNode = target.closest(".empty-line");

  if (isNonBreakableLineNode) {
    return false;
  }

  return isBreakpointMarkerNode || isLineNumberNode;
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
