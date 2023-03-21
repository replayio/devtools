import { useRouter } from "next/router";
import React, { useEffect } from "react";

import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";
import { setLoadingFinished } from "ui/reducers/app";
import { useAppDispatch } from "ui/setup/hooks";
import useAuth0 from "ui/utils/useAuth0";

import LoadingScreen from "../shared/LoadingScreen";
import Login from "../shared/Login/Login";

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

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <LibrarySpinner />
    </div>
  );
}
