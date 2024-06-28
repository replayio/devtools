import classNames from "classnames";
import React, { CSSProperties, ReactNode } from "react";

import ModalBackground from "./ModalBackground";

function FullViewportWrapper({
  children,
  classnames,
}: {
  children?: ReactNode;
  classnames?: string;
  style?: CSSProperties;
}) {
  return (
    <main
      className={classNames(
        "fixed z-50 flex h-full w-full items-center justify-center bg-loadingBackground",
        classnames
      )}
    >
      {children}
    </main>
  );
}

export function DefaultViewportWrapper({
  children,
  className = "",
  footer,
}: {
  children?: ReactNode;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <FullViewportWrapper>
      <ModalBackground />
      <div className={`relative space-y-4 ${className}`}>{children}</div>
      {footer}
    </FullViewportWrapper>
  );
}

export function BlankViewportWrapper({ children }: { children?: ReactNode }) {
  return <FullViewportWrapper style={{ background: "white" }}>{children}</FullViewportWrapper>;
}
