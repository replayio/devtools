import React from "react";

export default function Base64Image({ src, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) {
  if (!src) return null;

  return <img {...rest} src={`data:image/png;base64,${src}`} />;
}
