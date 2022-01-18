import classNames from "classnames";
import React, { CSSProperties, ReactNode } from "react";
import BubbleBackground from "./Onboarding/BubbleBackground";

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
        "w-full fixed h-full z-50 flex items-center justify-center bg-chrome",
        classnames
      )}
    >
      {children}
    </main>
  );
}

export function BubbleViewportWrapper({
  children,
  footer,
}: {
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <FullViewportWrapper style={{ background: "#f3f3f4" }}>
      <BubbleBackground />
      <div className="relative space-y-4">{children}</div>
      {footer}
    </FullViewportWrapper>
  );
}
export function BlankViewportWrapper({ children }: { children?: ReactNode }) {
  return <FullViewportWrapper style={{ background: "white" }}>{children}</FullViewportWrapper>;
}
