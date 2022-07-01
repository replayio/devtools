import React, { useEffect } from "react";
import { useAppDispatch } from "ui/setup/hooks";
import { setLoadingFinished } from "ui/reducers/app";
import useAuth0 from "ui/utils/useAuth0";
import Login from "../shared/Login/Login";
import { useRouter } from "next/router";
import LoadingScreen from "../shared/LoadingScreen";

export default function Account() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth0();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setLoadingFinished(true));
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/team");
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Login returnToPath={window.location.pathname + window.location.search} />;
  }

  return <LoadingScreen />;
}
