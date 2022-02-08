import { useRouter } from "next/router";
import React from "react";
import Login from "ui/components/shared/Login/Login";

export default function LoginPage() {
  const router = useRouter();

  return <Login returnToPath={"" + router.query.returnTo} />;
}
