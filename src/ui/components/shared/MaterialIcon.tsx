import classnames from "classnames";
import React from "react";

const SIZE_STYLES = {
  "2xl": "text-2xl",
  "4xl": "text-4xl",
  base: "text-base",
  lg: "text-lg",
  sm: "text-sm",
  xl: "text-xl",
  xs: "text-xs",
} as const;

type MaterialIconProps = React.HTMLProps<HTMLDivElement> & {
  children: string;
  outlined?: boolean;
  // tailwind text color style, e.g. text-white, text-blue-200
  color?: string;
  iconSize?: keyof typeof SIZE_STYLES;
};

export default function MaterialIcon({
  children,
  className,
  outlined,
  color,
  iconSize = "base",
  ...rest
}: MaterialIconProps) {
  return (
    <div
      {...rest}
      className={classnames(
        "select-none leading-none flex-shrink-0",
        className,
        outlined ? "material-icons-outlined" : "material-icons",
        SIZE_STYLES[iconSize]
      )}
    >
      {children}
    </div>
  );
}
