import classnames from "classnames";
import React, { useEffect, useState } from "react";

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

export const useMaterialIconCheck = () => {
  const [appNode, setAppNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (appNode && appNode.classList.contains("material-icon-loading")) {
      (document as any).fonts.ready.then(async () => {
        let retries = 10;
        while (retries-- > 0) {
          if (
            typeof document === "object" &&
            (document as any).fonts.check("12px Material Icons")
          ) {
            appNode.classList.remove("material-icon-loading");
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      });
    }
  }, [appNode]);

  return { setAppNode };
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
