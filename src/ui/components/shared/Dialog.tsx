import "./Dialog.css";
import classNames from "classnames";
import React, { HTMLProps, ReactNode } from "react";
import ReplayLogo from "./ReplayLogo";

export type DialogPropTypes = HTMLProps<HTMLDivElement>;

export function Dialog({ children, className, ...props }: DialogPropTypes) {
  return (
    <div {...props} className={classNames("dialog", className)} role="dialog">
      {children}
    </div>
  );
}

export const DialogLogo = ({ className, ...props }: HTMLProps<HTMLDivElement>) => {
  return (
    <div {...props} className={classNames("flex justify-center mb-5", className)}>
      <ReplayLogo size="sm" />
    </div>
  );
};

export const DialogTitle = ({ children, className, ...props }: HTMLProps<HTMLHeadingElement>) => {
  return (
    <h1 {...props} className={classNames("text-center text-lg font-medium mb-2", className)}>
      {children}
    </h1>
  );
};

export const DialogDescription = ({
  children,
  className,
  ...props
}: HTMLProps<HTMLParagraphElement>) => {
  return (
    <p {...props} className="mb-2 text-center text-gray-500 text-xs">
      {children}
    </p>
  );
};

export const DialogActions = ({ children, className, ...props }: HTMLProps<HTMLDivElement>) => {
  return (
    <div className={classNames("flex justify-between mt-6 w-full", className)}>{children}</div>
  );
};
