import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { clearExpectedError } from "ui/reducers/app";
import Login from "ui/components/shared/Login/Login";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(clearExpectedError());
  }, [dispatch]);

  return <Login returnToPath={"" + router.query.returnTo} />;
}
