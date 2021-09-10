import React from "react";
import useAuth0 from "ui/utils/useAuth0";
import Avatar from "ui/components/Avatar";
import { handleIntercomLogout } from "ui/utils/intercom";
import { PrimaryButton } from "./shared/Button";

const LoginButton = () => {
  const { loginWithRedirect, isAuthenticated, logout, user } = useAuth0();

  if (isAuthenticated) {
    return (
      <button className="row logout" onClick={() => handleIntercomLogout(logout)}>
        <Avatar player={user} isFirstPlayer={true} />
        <span>Sign Out</span>
      </button>
    );
  }

  return (
    <PrimaryButton
      onClick={() =>
        loginWithRedirect({
          appState: { returnTo: window.location.pathname + window.location.search },
        })
      }
      color="blue"
    >
      Sign In
    </PrimaryButton>
  );
};

export default LoginButton;
