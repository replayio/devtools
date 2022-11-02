import classNames from "classnames";
import React, { HTMLProps } from "react";

import ReplayLogo from "./ReplayLogo";

export type DialogPropTypes = HTMLProps<HTMLDivElement> & { showFooterLinks?: boolean };

export function Dialog({ children, className, showFooterLinks, ...props }: DialogPropTypes) {
  return (
    <>
      <div
        {...props}
        className={classNames("dialog flex flex-col items-center", className)}
        role="dialog"
        style={{ animation: "linearFadeIn ease 200ms", width: 400 }}
      >
        {children}
      </div>

      {!!showFooterLinks ? (
        <div className="grid grid-cols-1 place-items-center gap-1 pt-4 text-xs text-gray-400">
          <div>
            <div className="flex space-x-2">
              <div>
                <a className="hover:underline" href="http://docs.replay.io">
                  Documentation
                </a>
              </div>
              <div className="text-gray-300">•</div>
              <div>
                <a className="hover:underline" href="http://replay.io/discord/">
                  Discord
                </a>
              </div>
              <div className="text-gray-300">•</div>
              <div>
                <a className="hover:underline" href="mailto:support@replay.io">
                  Email support
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
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
    <p {...props} className="mb-2 whitespace-pre-wrap text-center text-sm text-themeBase-70">
      {children}
    </p>
  );
};

export const DialogActions = ({ children, className, ...props }: HTMLProps<HTMLDivElement>) => {
  return <div className={classNames("mt-6 flex w-full justify-center", className)}>{children}</div>;
};
