import classnames from "classnames";
import React, { useEffect } from "react";

const SIZE_STYLES = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
};

type MaterialIconProps = React.HTMLProps<HTMLDivElement> & {
  children: string;
  outlined?: boolean;
  // tailwind text color style, e.g. text-white, text-blue-200
  color?: string;
  iconSize?: keyof typeof SIZE_STYLES;
};

let isChecking = false;
function useMaterialIconCheck() {
  useEffect(() => {
    if (isChecking) {
      return;
    }
    isChecking = true;
    let id = setInterval(() => {
      if (typeof document === "object" && (document as any).fonts.check("12px Material Icons")) {
        document.body.classList.add("material-icon-loaded");
        clearInterval(id);
      }
    }, 100);
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
