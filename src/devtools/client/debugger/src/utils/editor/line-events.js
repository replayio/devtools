function dispatch(codeMirror, eventName, data) {
  codeMirror.constructor.signal(codeMirror, eventName, data);
}

export function onLineMouseOver(codeMirror) {
  return event => {
    event.target.addEventListener("mouseleave", e => dispatch(codeMirror, "lineLeave"), {
      capture: true,
      once: true,
    });

    dispatch(codeMirror, "lineEnter");
  };
}
