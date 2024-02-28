import classNames from "classnames";
import React, {
  Dispatch,
  MouseEventHandler,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";

import { Button } from "replay-next/components/Button";
import { actions } from "ui/actions";

import Modal from "../NewModal";
import ReplayLogo from "../ReplayLogo";
import styles from "./Onboarding.module.css";

const OnboardingContext = React.createContext({ theme: "dark" });

export function OnboardingContentWrapper({
  children,
  overlay,
  noLogo,
}: {
  children: React.ReactChild | (React.ReactChild | null)[];
  overlay?: boolean;
  noLogo?: boolean;
}) {
  const ctx = useContext(OnboardingContext);

  return (
    <div
      className={classNames(
        styles.onboardingLogin,
        overlay ? "max-w-sm space-y-8" : "max-w-xl space-y-3",
        {
          "rounded-lg bg-opacity-80": overlay,
        }
      )}
    >
      {noLogo ? null : <ReplayLogo size="md" color="white" />}
      {children}
    </div>
  );
}

export function OnboardingContent({
  children,
  noLogo,
}: {
  children: React.ReactChild | (React.ReactChild | null)[];
  noLogo?: boolean;
}) {
  return (
    <div className={styles.onboardingContent}>
      {noLogo ? null : <ReplayLogo size="md" color="white" />}
      {children}
    </div>
  );
}

export function OnboardingHeader({ children }: { children: string }) {
  return <div className="text-3xl font-extrabold">{children}</div>;
}

export function OnboardingBody({ children }: { children: string | ReactNode }) {
  return <div className="mx-10 text-center">{children}</div>;
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
      setCurrent(current => current + 1);
    }
  }, [allowNext, nextClicked, setCurrent]);

  const inferLoading = nextClicked && !allowNext;
  const buttonText = inferLoading ? "Loading" : text || "Next";

  return (
    <Button onClick={onClick} size="large">
      {buttonText}
    </Button>
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
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function OnboardingModalContainer({
  children,
  theme = "dark",
}: {
  children: React.ReactNode;
  theme?: "dark" | "light";
}) {
  return (
    <OnboardingContext.Provider value={{ theme }}>
      <div className={styles.modalContainer}>
        <Modal options={{ maskTransparency: "transparent" }} blurMask={false}>
          {children}
        </Modal>
      </div>
    </OnboardingContext.Provider>
  );
}
