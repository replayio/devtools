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
    <div {...props} className={classNames("mb-5 flex justify-center", className)}>
      <ReplayLogo size="md" />
    </div>
  );
};

export const DialogTitle = ({ children, className, ...props }: HTMLProps<HTMLHeadingElement>) => {
  return (
    <h1 {...props} className={classNames("mb-2 text-center text-lg font-medium", className)}>
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
    <p
      {...props}
      className="mb-2 text-center text-sm text-gray-500"
      style={{ minHeight: "2.5rem" }}
    >
      {children}
    </p>
  );
};

export const DialogActions = ({ children, className, ...props }: HTMLProps<HTMLDivElement>) => {
  return (
    <div className={classNames("mt-6 flex w-full justify-between", className)}>{children}</div>
  );
};
