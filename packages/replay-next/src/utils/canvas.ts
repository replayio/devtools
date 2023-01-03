export async function getBase64Png(
  canvas: HTMLCanvasElement,
  options: {
    maxWidth?: number;
    maxHeight?: number;
  } = {}
): Promise<string | null> {
  const base64PNG = canvas.toDataURL();
  if (!base64PNG) {
    return null;
  }

  const { maxHeight, maxWidth } = options;
  if (maxHeight == null && maxWidth == null) {
    return base64PNG;
  }

  return new Promise(resolve => {
    const image = new Image();
    image.src = base64PNG;
    image.onload = () => {
      const tempCanvas = document.createElement("canvas");

      let width = image.width;
      let height = image.height;

      if ((maxWidth == null || width < maxWidth) && (maxHeight == null || height < maxHeight)) {
        resolve(base64PNG);
        return;
      }

      if (maxWidth != null) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      }

      if (maxHeight != null) {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      tempCanvas.width = width;
      tempCanvas.height = height;

      const context = tempCanvas.getContext("2d");
      if (context) {
        context.drawImage(image, 0, 0, width, height);
        resolve(tempCanvas.toDataURL());
      } else {
        resolve(null);
      }
    };
  });
}
