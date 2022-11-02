import { useRouter } from "next/router";
import React, { useEffect } from "react";

import Login from "ui/components/shared/Login/Login";
import { clearExpectedError } from "ui/reducers/app";
import { useAppDispatch } from "ui/setup/hooks";
import useAuth0 from "ui/utils/useAuth0";

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth0();
  const dispatch = useAppDispatch();

  const challenge = Array.isArray(router.query.challenge)
    ? router.query.challenge[0]
    : router.query.challenge;
  const state = Array.isArray(router.query.state) ? router.query.state[0] : router.query.state;

  if (user && typeof router.query.returnTo === "string" && !challenge && !state) {
    router.push(router.query.returnTo);
  }

  useEffect(() => {
    dispatch(clearExpectedError());
  }, [dispatch]);

  return (
    <Login
      returnToPath={String(router.query.returnTo || "/")}
      state={state}
      challenge={challenge}
    />
  );
}
