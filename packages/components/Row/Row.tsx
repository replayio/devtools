import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type RowProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  gap?: number;
};

export function Row<T extends ElementType = "div">({
  as,
  children,
  gap,
  style,
  ...props
}: RowProps<T> & ComponentPropsWithoutRef<T>) {
  const Element = as || "div";
  return (
    <Element className="flex flex-row" style={{ gap: `${gap}rem`, ...style }} {...props}>
      {children}
    </Element>
  );
}
