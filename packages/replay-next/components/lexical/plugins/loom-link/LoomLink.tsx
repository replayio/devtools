import { Suspense } from "react";

import { LoomLinkNode } from "./LoomLinkNode";
import styles from "./LoomLink.module.css";

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

export default function LoomLink({ loomId }: { loomId: string }): JSX.Element {
  const url = LoomLinkNode.loomIdToShareUrl(loomId);

  return (
    <Suspense fallback={null}>
      <a href={url} rel="noreferrer" target="_blank">
        <LazyImage loomId={loomId} />
      </a>
    </Suspense>
  );
}

function LazyImage({ loomId }: { loomId: string }): JSX.Element {
  const url = LoomLinkNode.loomIdToImageUrl(loomId);

  useSuspenseImage(url);

  return <img className={styles.Image} data-loom-id={loomId} src={url} />;
}
