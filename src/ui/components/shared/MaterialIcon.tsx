import classnames from "classnames";
import React, { useEffect } from "react";

const SIZE_STYLES = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "4xl": "text-4xl",
};

type MaterialIconProps = React.HTMLProps<HTMLDivElement> & {
  children: string;
  outlined?: boolean;
  // tailwind text color style, e.g. text-white, text-blue-200
  color?: string;
  iconSize?: keyof typeof SIZE_STYLES;
};

function useMaterialIconCheck() {
  useEffect(() => {
    document.fonts.ready.then(() => {
      if (typeof document === "object" && document.fonts.check("12px Material Icons")) {
        console.log("ready");
        document.body.classList.add("material-icon-loaded");
      }
    });
  }, []);
}

export default function MaterialIcon({
  children,
  className,
  outlined,
  color,
  iconSize = "base",
  ...rest
}: MaterialIconProps) {
  useMaterialIconCheck();

  return (
    <div
      {...rest}
      className={classnames(
        "leading-none",
        className,
        outlined ? "material-icons-outlined" : "material-icons",
        SIZE_STYLES[iconSize]
      )}
    >
      {children}
    </div>
  );
}
