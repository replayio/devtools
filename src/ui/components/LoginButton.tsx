import React, { FC, useContext } from "react";

import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { login, logout } from "ui/utils/auth";

import Avatar from "./Avatar";

interface LoginButtonProps {
  variant?: string;
  iconPosition?: "left" | "right";
}

const LoginButton: FC<LoginButtonProps> = ({ variant, iconPosition = "left" }) => {
  const { accessToken, currentUserInfo } = useContext(SessionContext);

  if (accessToken) {
    return (
      <button
        className={`row logout ${iconPosition === "right" ? "flex-row-reverse" : ""}`}
        onClick={() => logout()}
      >
        <Avatar player={currentUserInfo} isFirstPlayer={true} />
        <span className="w-full text-left">Sign Out</span>
      </button>
    );
  }

  return (
    <button
      className={`row logout ${iconPosition === "right" ? "flex-row-reverse" : ""}`}
      onClick={() => login()}
    >
      <span className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-primaryAccent px-3 py-1.5 text-sm font-medium leading-4 text-buttontextColor hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        Sign In
      </span>
    </button>
  );
};

export default LoginButton;
