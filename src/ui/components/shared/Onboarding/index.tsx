import classNames from "classnames";
import React, { Dispatch, MouseEventHandler, SetStateAction, useEffect, useState } from "react";
import { actions } from "ui/actions";
import BlankScreen from "../BlankScreen";
import { PrimaryLgButton } from "../Button";
const Circles = require("ui/components/shared/Circles.js").default;
import Modal from "../NewModal";

export function OnboardingContent({
  children,
}: {
  children: React.ReactChild | React.ReactChild[];
}) {
  return (
    <div
      className="p-12 text-4xl space-y-16 relative flex flex-col items-center"
      style={{ width: "800px" }}
    >
      <ReplayLogo />
      {children}
    </div>
  );
}

export function OnboardingHeader({ children }: { children: string }) {
  return <div className="text-7xl font-semibold">{children}</div>;
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
  return <div className="space-x-4 pt-16">{children}</div>;
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
        "max-w-max items-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent text-white bg-primaryAccent hover:bg-primaryAccentHover"
      )}
    >
      {children}
    </button>
  );
}

export function OnboardingModalContainer({
  children,
  randomNumber = 0,
}: {
  children: React.ReactElement;
  randomNumber?: number;
}) {
  return (
    <div className="w-full h-full grid fixed bg-white">
      <Circles randomNumber={randomNumber} />
      <Modal options={{ maskTransparency: "transparent" }} blurMask={false}>
        {children}
      </Modal>
    </div>
  );
}

export const ReplayLogo = () => <img className="w-24 h-24" src="/images/logo.svg" />;
