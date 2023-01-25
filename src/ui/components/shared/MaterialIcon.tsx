import classnames from "classnames";
import React from "react";

const SIZE_STYLES = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "4xl": "text-4xl",
} as const;

type MaterialIconProps = React.HTMLProps<HTMLDivElement> & {
  children: string | React.ReactElement;
  outlined?: boolean;
  iconSize?: keyof typeof SIZE_STYLES;
  title?: string;
};

export default function MaterialIcon({
  children,
  className,
  color,
  iconSize = "base",
  outlined,
  title,
  ...rest
}: MaterialIconProps) {
  const isIconFont = typeof children === "string";

  return (
    <div
      {...rest}
      className={classnames(
        "flex-shrink-0 select-none leading-none",
        className,
        {
          "material-icons-outlined": outlined && isIconFont,
          "material-icons": !outlined && isIconFont,
        },
        SIZE_STYLES[iconSize]
      )}
      title={title}
    >
      {children}
    </div>
  );
}
