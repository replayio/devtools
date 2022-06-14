import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useAppDispatch } from "ui/setup/hooks";
import Login from "ui/components/shared/Login/Login";
import { clearExpectedError } from "ui/reducers/app";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(clearExpectedError());
  }, [dispatch]);

  return <Login returnToPath={"" + (router.query.returnTo || "/")} />;
}
