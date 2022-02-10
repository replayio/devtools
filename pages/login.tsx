import { useRouter } from "next/router";
import React, { FC, useEffect } from "react";
import { useDispatch } from "react-redux";
import { clearExpectedError } from "ui/actions/session";
import Login from "ui/components/shared/Login/Login";

const LoginPage: FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(clearExpectedError());
  }, [dispatch]);

  return <Login returnToPath={"" + router.query.returnTo} />;
};

export default LoginPage;
