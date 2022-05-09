import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import Login from "ui/components/shared/Login/Login";
import { clearExpectedError } from "ui/reducers/app";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(clearExpectedError());
  }, [dispatch]);

  return <Login returnToPath={"" + router.query.returnTo} />;
}
