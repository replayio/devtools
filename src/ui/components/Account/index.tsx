import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setLoadingFinished } from "ui/actions/app";

import useAuth0 from "ui/utils/useAuth0";

import Library from "../Library/index";
import Login from "../shared/Login/Login";

export default function Account() {
  const { isLoading, isAuthenticated } = useAuth0();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setLoadingFinished(true));
  }, [])

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Login returnToPath={window.location.pathname + window.location.search} />;
  }

  return <Library />;
}
