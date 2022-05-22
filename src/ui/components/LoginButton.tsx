import classNames from "classnames";
import React from "react";
import Avatar from "ui/components/Avatar";
import { DropdownItem } from "ui/components/Library/LibraryDropdown";
import { handleIntercomLogout } from "ui/utils/intercom";

const LoginButton = () => {
  const { loginAndReturn, isAuthenticated, logout, user } = useAuth0();

  if (isAuthenticated) {
    return (
      <button className="row logout" onClick={() => logout()}>
        <Avatar player={user} isFirstPlayer={true} />
        <span>Sign Out</span>
      </button>
    );
  }

  return (
    <DropdownItem onClick={() => loginAndReturn()}>
      Sign In
    </DropdownItem>
  );
};

export default LoginButton;
