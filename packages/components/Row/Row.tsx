import classNames from "classnames";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { SpacingProps } from "../types";
import { getSpacingClassNamesFromProps } from "../utils";

type RowProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
} & SpacingProps;

/** Position children in a horizontal layout. */
export function Row<T extends ElementType = "div">({
  as,
  children,
  ...props
}: RowProps<T> & ComponentPropsWithoutRef<T>) {
  const Element = as || "div";
  const parsedProps = getSpacingClassNamesFromProps(props);

  return (
    <Element {...parsedProps} className={classNames("flex flex-row", parsedProps.className)}>
      {children}
    </Element>
  );
}
