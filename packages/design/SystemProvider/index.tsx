import Head from "next/head";
import type { ReactNode } from "react";

import iconSprite from "../Icon/sprite.svg";

/** Provides design system functionality to all descendant components. */
export function SystemProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <Head>
        <link rel="preload" as="image" href={iconSprite} />
      </Head>

      {children}
    </>
  );
}
