import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useAppDispatch } from "ui/setup/hooks";
import Login from "ui/components/shared/Login/Login";
import { clearExpectedError } from "ui/reducers/app";
import useAuth0 from "ui/utils/useAuth0";

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth0();
  const dispatch = useAppDispatch();

  if (user && typeof router.query.returnTo === "string") {
    router.push(router.query.returnTo);
  }

  useEffect(() => {
    dispatch(clearExpectedError());
  }, [dispatch]);

  return <Login returnToPath={String(router.query.returnTo || "/")} />;
}
