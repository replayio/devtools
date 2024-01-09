import React, { AnchorHTMLAttributes, ReactNode } from "react";

export default function ExternalLink({
  children,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel"> & { children: ReactNode }) {
  return (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
