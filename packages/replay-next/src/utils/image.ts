import assert from "assert";

type Dimensions = { aspectRatio: number; height: number; width: number };

export async function getDimensions(base64: string, mimeType: string): Promise<Dimensions> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => {
      const { height, width } = image;
      resolve({
        aspectRatio: width / height,
        height,
        width,
      });
    });
    image.addEventListener("error", () => {
      reject("Image data could not be loaded");
    });
    image.src = `data:${mimeType};base64,${base64}`;
  });
}

export function fitImageToContainer({
  containerHeight,
  containerWidth,
  imageHeight,
  imageWidth,
}: {
  containerHeight: number;
  containerWidth: number;
  imageHeight: number;
  imageWidth: number;
}): {
  height: number;
  width: number;
} {
  const ratio = Math.min(containerWidth / imageWidth, containerHeight / imageHeight);

  return { width: imageWidth * ratio, height: imageHeight * ratio };
}

export function scaleImage(options: {
  imageElement: HTMLImageElement;
  maxHeight: number;
  maxWidth: number;
}) {
  const { imageElement, maxHeight, maxWidth } = options;
  let { height, width } = imageElement;

  if (height < maxHeight && width < maxWidth) {
    return imageElement;
  }

  if (width > maxWidth) {
    height *= maxWidth / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width *= maxHeight / height;
    height = maxHeight;
  }

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;

  const context = tempCanvas.getContext("2d");
  assert(context);

  context.drawImage(imageElement, 0, 0, width, height);

  const scaledImage = document.createElement("img");
  scaledImage.src = tempCanvas.toDataURL();

  return scaledImage;
}
