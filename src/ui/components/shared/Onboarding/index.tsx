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
import { actions } from "ui/actions";
import { PrimaryLgButton } from "../Button";
import Modal from "../NewModal";
import ReplayLogo from "../ReplayLogo";
import BubbleBackground from "./BubbleBackground";

const OnboardingContext = React.createContext({ theme: "dark" });

export function OnboardingContentWrapper({
  children,
  overlay,
}: {
  children: React.ReactChild | (React.ReactChild | null)[];
  overlay?: boolean;
}) {
  const ctx = useContext(OnboardingContext);

  return (
    <div
      className={classNames(
        "relative m-4 flex flex-col items-center border-modalBorder bg-modalBgcolor p-9 text-2xl text-menuColor shadow-md",
        overlay ? "max-w-sm space-y-8" : "max-w-3xl space-y-12",
        {
          "rounded-lg bg-opacity-80": overlay,
        }
      )}
    >
      <ReplayLogo size={overlay ? "md" : "lg"} wide={overlay} />
      {children}
    </div>
  );
}

export function OnboardingContent({
  children,
}: {
  children: React.ReactChild | (React.ReactChild | null)[];
}) {
  return <div className="relative flex flex-col items-center space-y-4">{children}</div>;
}

export function OnboardingHeader({ children }: { children: string }) {
  return <div className="text-5xl font-extrabold">{children}</div>;
}

export function OnboardingBody({ children }: { children: string | ReactNode }) {
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
        "max-w-max items-center rounded-md border border-transparent bg-primaryAccent px-3 py-1.5 font-medium text-white shadow-sm hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2"
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
    <OnboardingContext.Provider value={{ theme }}>
      <div
        className={classNames(
          "fixed z-50 grid h-full w-full",
          theme === "dark" ? "bg-black text-white" : "bg-chrome text-black"
        )}
      >
        <BubbleBackground />
        <Modal options={{ maskTransparency: "transparent" }} blurMask={false}>
          {children}
        </Modal>
      </div>
    </OnboardingContext.Provider>
  );
}
