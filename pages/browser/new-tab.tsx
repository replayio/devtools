import React from "react";
import { useGetUserInfo } from "ui/hooks/users";

export default function NewTab() {
  const { motd } = useGetUserInfo();

  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="text-center space-y-8">
        {motd ? <h2 className="text-2xl text-gray-600">{motd}</h2> : null}
        <img src="/images/logo.svg" className="inline-block h-24 w-24" />
        <h1 style={{ width: 420 }} className="text-2xl text-gray-600">
          Please navigate to the page you want to record, then press the blue record button.
        </h1>
      </div>
    </div>
  );
}
