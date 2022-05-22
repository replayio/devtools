import classNames from "classnames";
import React from "react";
import Avatar from "ui/components/Avatar";
import { DropdownItem } from "ui/components/Library/LibraryDropdown";
import { handleIntercomLogout } from "ui/utils/intercom";
import useAuth0 from "ui/utils/useAuth0";

const LoginButton = () => {
  const { loginAndReturn, isAuthenticated, logout, user } = useAuth0();

  if (isAuthenticated) {
    return (
      <DropdownItem onClick={() => handleIntercomLogout(logout)}>
        <div className="flex flex-row space-x-4">
          <div className={classNames("flex w-4 flex-row items-center")}>
            <Avatar player={user} isFirstPlayer={true} />
          </div>
          <span className="overflow-hidden overflow-ellipsis whitespace-pre">Sign Out</span>
        </div>
      </DropdownItem>
    );
  }

  return (
    <DropdownItem onClick={() => loginAndReturn()}>
      Sign In
    </DropdownItem>
  );
};

export default LoginButton;
