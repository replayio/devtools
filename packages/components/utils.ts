import classNames from "classnames";

import { SpacingProps } from "./types";

/** Transforms spacing style props into Tailwind class names. */
export function getSpacingClassNamesFromProps<Props extends SpacingProps>({
  padding,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  paddingHorizontal,
  paddingVertical,
  gap,
  ...props
}: Props) {
  const className = classNames(
    padding && `p-${padding}`,
    paddingTop && `pt-${paddingTop}`,
    paddingRight && `pr-${paddingRight}`,
    paddingBottom && `pb-${paddingBottom}`,
    paddingLeft && `pl-${paddingLeft}`,
    paddingHorizontal && `px-${paddingHorizontal}`,
    paddingVertical && `py-${paddingVertical}`,
    gap && `gap-${gap}`
  );
  const previousClassName = (props as any).className;

  return {
    ...props,
    className: previousClassName ? `${previousClassName} ${className}` : className,
  };
}
