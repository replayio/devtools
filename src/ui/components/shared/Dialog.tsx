import classNames from "classnames";
import React, { HTMLProps } from "react";

import ReplayLogo from "./ReplayLogo";

export type DialogPropTypes = HTMLProps<HTMLDivElement> & { showFooterLinks?: boolean } & {
  showIllustration?: boolean;
};

export function Dialog({
  children,
  className,
  showFooterLinks,
  showIllustration,
  ...props
}: DialogPropTypes) {
  return (
    <>
      <div
        {...props}
        className={classNames("dialog flex flex-col items-center", className)}
        role="dialog"
        style={{ animation: "linearFadeIn ease 200ms", width: 400 }}
      >
        {showIllustration ? <DialogIllustration /> : null}
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
    <div {...props} className={classNames("my-5 flex justify-center", className)}>
      <ReplayLogo size="sm" />
    </div>
  );
};

export const DialogIllustration = ({
  children,
  className,
  ...props
}: HTMLProps<HTMLHeadingElement>) => {
  const randomNum = Math.floor(Math.random() * 5) + 1;
  const imagePath = `/images/illustrations/ready${randomNum}.png`;

  return (
    <div>
      <img src={imagePath} className="w-fill mb-8 rounded-lg" />
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
    <p {...props} className="break-word mb-2 whitespace-pre-wrap text-center text-sm px-6">
      {children}
    </p>
  );
};

export const DialogActions = ({ children, className, ...props }: HTMLProps<HTMLDivElement>) => {
  return <div className={classNames("mt-6 flex w-full justify-center", className)}>{children}</div>;
};
