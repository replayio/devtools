import "./Dialog.css";
import classNames from "classnames";
import React, { HTMLProps, ReactNode } from "react";

type PropTypes = HTMLProps<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
};

export function Dialog({ children, className, ...props }: PropTypes) {
  return (
    <div {...props} className={classNames("dialog rounded-lg p-5", className)}>
      {children}
    </div>
  );
}
