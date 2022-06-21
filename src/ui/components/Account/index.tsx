import React, { useEffect } from "react";
import { useAppDispatch } from "ui/setup/hooks";
import { setLoadingFinished } from "ui/reducers/app";
import useAuth0 from "ui/utils/useAuth0";

import Library from "../Library/index";
import Login from "../shared/Login/Login";

export default function Account({ testRunId }: { testRunId?: string }) {
  const { isLoading, isAuthenticated } = useAuth0();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setLoadingFinished(true));
  }, [dispatch]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Login returnToPath={window.location.pathname + window.location.search} />;
  }

  return <Library testRunId={testRunId} />;
}
