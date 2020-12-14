function dispatch(codeMirror, eventName, data) {
  codeMirror.constructor.signal(codeMirror, eventName, data);
}

export function isValidTarget(target) {
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

    target.addEventListener("mouseleave", event => dispatch(codeMirror, "gutterLineLeave", event), {
      capture: true,
      once: true,
    });

    dispatch(codeMirror, "gutterLineEnter", event);
  };
}
