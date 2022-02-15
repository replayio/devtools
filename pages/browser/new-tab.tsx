import React from "react";
import { LoadingScreenTemplate } from "ui/components/shared/LoadingScreen";
import { useGetUserInfo } from "ui/hooks/users";

export default function NewTab() {
  const { motd } = useGetUserInfo();

  return (
    <LoadingScreenTemplate>
      <div className="space-y-8 text-center">
        {motd ? <h2 className="text-2xl text-gray-600">{motd}</h2> : null}
        <div className="text-md text-gray-600">
          Please navigate to the page you want to record, then press the blue record button.
        </div>
      </div>
    </LoadingScreenTemplate>
  );
}
