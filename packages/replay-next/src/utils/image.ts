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
      reject();
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
