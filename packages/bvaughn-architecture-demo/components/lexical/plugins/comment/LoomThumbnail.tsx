import * as React from "react";
import { Suspense } from "react";

import { LoomThumbnailNode } from "./LoomThumbnailNode";
import "./LoomThumbnail.css";

const imageCache = new Set();

function useSuspenseImage(src: string) {
  if (!imageCache.has(src)) {
    throw new Promise(resolve => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        imageCache.add(src);
        resolve(null);
      };
    });
  }
}

export default function LoomThumbnail({ loomId }: { loomId: string }): JSX.Element {
  const url = LoomThumbnailNode.loomIdToShareUrl(loomId);

  return (
    <Suspense fallback={null}>
      <a href={url} rel="noreferrer" target="_blank">
        <LazyImage loomId={loomId} />
      </a>
    </Suspense>
  );
}

function LazyImage({ loomId }: { loomId: string }): JSX.Element {
  const url = LoomThumbnailNode.loomIdToImageUrl(loomId);

  useSuspenseImage(url);

  // TODO Style
  return <img className="loom-thumbnail" data-loom-id={loomId} src={url} />;
}
