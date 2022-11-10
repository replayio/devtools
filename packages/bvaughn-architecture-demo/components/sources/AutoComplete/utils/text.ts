let cachedContext: CanvasRenderingContext2D | null = null;

function getCanvasRenderingContext2D(): CanvasRenderingContext2D {
  if (cachedContext === null) {
    const canvas = document.createElement("canvas");
    cachedContext = canvas.getContext("2d");
  }

  return cachedContext!;
}

export function measureTextForHTMLElement(text: string, htmlElement: HTMLElement): TextMetrics {
  const computedStyle = window.getComputedStyle(htmlElement);

  const context = getCanvasRenderingContext2D();
  context.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;

  return context.measureText(text);
}
