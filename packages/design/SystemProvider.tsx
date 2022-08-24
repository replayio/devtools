import type { ReactNode } from "react";
import Head from "next/head";

import iconsSprite from "./Icon/sprite.svg";

/** Provides design system functionality to all descendant components. */
export function SystemProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <Head>
        <link rel="preload" as="image" href={iconsSprite} />
      </Head>

      {children}
    </>
  );
}
