import React, { useEffect } from "react";

import { setLoadingFinished } from "ui/actions/app";
import Library from "ui/components/Library";
import Login from "ui/components/shared/Login/Login";
import { useAppDispatch } from "ui/setup/hooks";
import useAuth0 from "ui/utils/useAuth0";

export default function TeamIndex() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth0();

  useEffect(() => {
    dispatch(setLoadingFinished(true));
  }, [dispatch]);

  if (!isAuthenticated) {
    return <Login returnToPath={window.location.pathname + window.location.search} />;
  }

  return <Library />;
}
