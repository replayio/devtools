import classNames from "classnames";
import React, { Dispatch, MouseEventHandler, SetStateAction, useEffect, useState } from "react";
import { actions } from "ui/actions";
import { PrimaryLgButton } from "../Button";
import Modal from "../NewModal";
import BubbleBackground from "./BubbleBackground";

export function OnboardingContentWrapper({
  children,
}: {
  children: React.ReactChild | (React.ReactChild | null)[];
}) {
  return (
    <div
      className="p-9 text-2xl space-y-12 relative flex flex-col items-center"
      style={{ width: "800px" }}
    >
      <ReplayLogo />
      {children}
    </div>
  );
}

export function OnboardingContent({
  children,
}: {
  children: React.ReactChild | (React.ReactChild | null)[];
}) {
  return <div className="space-y-4 relative flex flex-col items-center">{children}</div>;
}

export function OnboardingHeader({ children }: { children: string }) {
  return <div className="text-5xl font-extrabold">{children}</div>;
}

export function OnboardingBody({
  children,
}: {
  children: string | React.ReactChild | React.ReactChild[];
}) {
  return <div className="text-center">{children}</div>;
}

export function OnboardingActions({
  children,
}: {
  children: string | React.ReactChild | React.ReactChild[];
}) {
  return <div className="space-x-6">{children}</div>;
}

export function NextButton({
  current,
  text,
  setCurrent,
  onNext,
  allowNext,
}: {
  current: number;
  text?: string;
  setCurrent: Dispatch<SetStateAction<number>>;
  hideModal: typeof actions.hideModal;
  onNext: () => void;
  allowNext: boolean;
}) {
  const [nextClicked, setNextClicked] = useState<boolean>(false);

  const onClick = () => {
    if (onNext) {
      onNext();
    }
    setNextClicked(true);
  };

  useEffect(() => {
    // Only navigate to the next slide the work that eventually turns
    // allowNext to true is finished. This allows us to do mutations
    // in between navigations.
    if (allowNext && nextClicked) {
      setCurrent(current + 1);
    }
  }, [allowNext, nextClicked]);

  const inferLoading = nextClicked && !allowNext;
  const buttonText = inferLoading ? "Loading" : text || "Next";

  return (
    <PrimaryLgButton color="blue" onClick={onClick}>
      {buttonText}
    </PrimaryLgButton>
  );
}

export function OnboardingButton({
  children,
  onClick = () => {},
  className,
  disabled = false,
}: {
  children: React.ReactElement | string;
  className?: string;
  onClick?: MouseEventHandler;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        className,
        "max-w-max items-center px-3 py-1.5 border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent text-white bg-primaryAccent hover:bg-primaryAccentHover"
      )}
    >
      {children}
    </button>
  );
}

export function OnboardingModalContainer({
  children,
  theme = "dark",
}: {
  children: React.ReactElement;
  // For randomizing some background elements as controlled by progress
  // on the parent component, e.g. circles/bubbles that change on click
  randomNumber?: number;
  theme?: "dark" | "light";
}) {
  return (
    <div
      className={classNames(
        "w-full h-full grid fixed z-50",
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      )}
    >
      <>
        <BubbleBackground />
        <Modal options={{ maskTransparency: "transparent" }} blurMask={false}>
          {children}
        </Modal>
      </>
    </div>
  );
}

export const ReplayLogo = () => <img className="w-32 h-32" src="/images/logo.svg" />;
