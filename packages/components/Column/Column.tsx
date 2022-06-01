import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type ColumnProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  gap?: number;
};

export function Column<T extends ElementType = "div">({
  as,
  children,
  gap,
  style,
  ...props
}: ColumnProps<T> & ComponentPropsWithoutRef<T>) {
  const Element = as || "div";
  return (
    <Element className="flex flex-col" style={{ gap: `${gap}rem`, ...style }} {...props}>
      {children}
    </Element>
  );
}
