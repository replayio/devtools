export async function getAspectRatio(base64: string, mimeType: string): Promise<number> {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      const { height, width } = image;
      resolve(width / height);
    };
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
