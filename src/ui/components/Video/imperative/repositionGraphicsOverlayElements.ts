export function repositionGraphicsOverlayElements({
  containerElement,
  graphicsElement,
  graphicsOverlayElement,
}: {
  containerElement: HTMLElement;
  graphicsElement: HTMLElement;
  graphicsOverlayElement: HTMLElement;
}) {
  const containerRect = containerElement.getBoundingClientRect();
  const imageRect = graphicsElement.getBoundingClientRect();

  graphicsOverlayElement.style.left = `${imageRect.left - containerRect.left}px`;
  graphicsOverlayElement.style.top = `${imageRect.top - containerRect.top}px`;
  graphicsOverlayElement.style.width = `${imageRect.width}px`;
  graphicsOverlayElement.style.height = `${imageRect.height}px`;
}
