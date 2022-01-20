import React from "react";

import useAuth0 from "ui/utils/useAuth0";

import Library from "../Library/index";
import Login from "../shared/Login/Login";

export default function Account() {
  const { isLoading, isAuthenticated } = useAuth0();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Library />;
}
