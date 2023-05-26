import React from "react";

import { LoadingScreenTemplate } from "ui/components/shared/LoadingScreen";
import { useGetUserInfo } from "ui/hooks/users";

export default function NewTab() {
  const { motd } = useGetUserInfo();

  return (
    <LoadingScreenTemplate>
      <div className="space-y-8 text-center">
        {motd ? <h2 className="text-2xl">{motd}</h2> : null}
        <div className="text-base">
          Please navigate to the page you want to record, then press the blue record button.
        </div>
      </div>
    </LoadingScreenTemplate>
  );
}
