import React from "react";

export default function Base64Image({
  src,
  format,
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement> & { format?: string | null }) {
  if (!src || !format) {
    return null;
  }

  return <img {...rest} src={`data:${format};base64,${src}`} />;
}
