import { trackEventOnce } from "ui/utils/mixpanel";

type $FixTypeLater = any;

export function dispatch(codeMirror: $FixTypeLater, eventName: string, data: $FixTypeLater) {
  codeMirror.constructor.signal(codeMirror, eventName, data);
}

export const getLineNumberNode = (target: HTMLElement) =>
  target.querySelector<HTMLElement>(".CodeMirror-linenumber");
const isHoveredOnLine = (target: HTMLElement) => !!target.closest(".CodeMirror-line");
const isHoveredOnGutter = (target: HTMLElement) => !!target.closest(".CodeMirror-gutter-wrapper");
// This is some real ugly dom traversal but CodeMirror makes it difficult to do anything else.
// If you do find yourself in the unfortunate situation of debugging something around here,
// make sure you have your elements panel locked and loaded.
const getLineNodeFromGutterTarget = (target: HTMLElement) =>
  target.closest(".CodeMirror-gutter-wrapper")!.parentElement!.querySelector(".CodeMirror-line");

function isValidTarget(target: HTMLElement) {
  const isNonBreakableLineNode = target.closest(".empty-line");
  const isTooltip = target.closest(".static-tooltip");

  return (
    (isHoveredOnLine(target) || isHoveredOnGutter(target)) && !isNonBreakableLineNode && !isTooltip
  );
}

function emitLineMouseEnter(
  codeMirror: $FixTypeLater,
  target: HTMLElement,
  clientX: number,
  clientY: number
) {
  trackEventOnce("editor.mouse_over");
  const { line: lineIndex, ch: columnIndex } = codeMirror.coordsChar(
    { left: clientX, top: clientY },
    "window"
  );

  const lineNode = isHoveredOnLine(target)
    ? target.closest(".CodeMirror-line")
    : getLineNodeFromGutterTarget(target);
  const row = lineNode!.parentElement!;
  const lineNumberNode = getLineNumberNode(row);

  target.addEventListener(
    "mouseleave",
    () => {
      const gutterButton = lineNumberNode!.querySelector(".CodeMirror-gutter-wrapper button");

      // Don't trigger a mouse leave event if the user ends up hovering on the gutter button.
      if (gutterButton && !gutterButton.matches(":hover")) {
        dispatch(codeMirror, "lineMouseLeave", {
          columnIndex,
          lineIndex,
          lineNumberNode,
        });
      }
    },
    {
      capture: true,
      once: true,
    }
  );

  dispatch(codeMirror, "lineMouseEnter", {
    columnIndex,
    lineIndex,
    lineNumberNode,
  });
}

export function onLineMouseOver(codeMirror: $FixTypeLater) {
  return (event: MouseEvent) => {
    let target = event.target! as HTMLElement;

    // Hacky, try to fix this.
    if (target.closest(".CodeMirror-linewidget")) {
      target = target
        .closest(".CodeMirror-linewidget")!
        .parentElement!.querySelector(".CodeMirror-line")!;
    }

    if (isValidTarget(target)) {
      emitLineMouseEnter(codeMirror, target, event.clientX, event.clientY);
    }
  };
}

// Copied from `onLineMouseOver` above, but requires `clientX/clientY` passed  in/
// because scroll events don't appear to contain those coords
export function onMouseScroll(codeMirror: $FixTypeLater, clientX: number, clientY: number) {
  let target = document.elementFromPoint(clientX, clientY) as HTMLElement;
  // Hacky, try to fix this.
  if (target?.closest(".CodeMirror-linewidget")) {
    target = target
      .closest(".CodeMirror-linewidget")!
      .parentElement!.querySelector(".CodeMirror-line")!;
  }

  if (isValidTarget(target) && codeMirror) {
    emitLineMouseEnter(codeMirror, target, clientX, clientY);
  }
}
