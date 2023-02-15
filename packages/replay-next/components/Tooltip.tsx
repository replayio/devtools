import { CSSProperties, ForwardedRef, ReactNode, forwardRef } from "react";
import { createPortal } from "react-dom";

import styles from "./Tooltip.module.css";

type TooltipProps = {
  children: ReactNode;
  className?: string;
  forwardedRef?: ForwardedRef<HTMLDivElement>;
  style?: CSSProperties;
};

function Tooltip({ children, className, forwardedRef, style }: TooltipProps) {
  className = className ? `${styles.Tooltip} ${className}` : styles.Tooltip;

  return createPortal(
    <div className={className} style={style} ref={forwardedRef}>
      {children}
    </div>,
    document.body
  );
}

function TooltipRefForwarder(props: TooltipProps, ref: ForwardedRef<HTMLDivElement>) {
  return <Tooltip forwardedRef={ref} {...props} />;
}

export default forwardRef(TooltipRefForwarder);
