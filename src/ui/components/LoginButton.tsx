import React, { FC } from "react";
import Avatar from "ui/components/Avatar";
import useAuth0 from "ui/utils/useAuth0";
import MaterialIcon from "ui/components/shared/MaterialIcon";

interface LoginButtonProps {
  variant?: string;
}

const LoginButton: FC<LoginButtonProps> = ({ variant }) => {
  const { loginAndReturn, isAuthenticated, logout, user } = useAuth0();

  if (isAuthenticated) {
    return (
      <button
        className="row logout"
        onClick={() => logout({ returnTo: window.location.origin + "/login" })}
      >
        <Avatar player={user} isFirstPlayer={true} />
        <span>Sign Out</span>
      </button>
    );
  }

  if (variant === "Tour") {
    return (
      <button type="button" onClick={() => loginAndReturn()} style={{ padding: "4px 8px" }}>
        <div className="mr-1">Sign in</div>
        <MaterialIcon style={{ fontSize: "16px" }}>arrow_forward</MaterialIcon>
      </button>
    );
  }

  return (
    <button
      className="row logout"
      onClick={() => loginAndReturn()}
    >
      <span className="inline-flex items-center rounded-md border border-transparent bg-primaryAccent px-3 py-1.5 text-sm font-medium leading-4 text-buttontextColor hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full justify-center">Sign In</span>
    </button>
  );
};

export default LoginButton;

