declare global {
  interface Window {
    mouseClientX?: number;
    mouseClientY?: number;
    elementIsHovered(elem: Element): boolean;
  }
}

export function setupDOMHelpers() {
  // Set the current mouse position on the window. This is used in places where
  // testing element.matches(":hover") does not work right for some reason.
  document.body.addEventListener("mousemove", e => {
    window.mouseClientX = e.clientX;
    window.mouseClientY = e.clientY;
  });
  window.elementIsHovered = elem => {
    if (!elem) {
      return false;
    }
    const { left, top, right, bottom } = elem.getBoundingClientRect();
    const { mouseClientX, mouseClientY } = window;
    return (
      left <= mouseClientX! &&
      mouseClientX! <= right &&
      top <= mouseClientY! &&
      mouseClientY! <= bottom
    );
  };
}
