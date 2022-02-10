import React, { FC } from "react";
import { LoadingScreenTemplate } from "ui/components/shared/LoadingScreen";
import { useGetUserInfo } from "ui/hooks/users";

const NewTab: FC = () => {
  const { motd } = useGetUserInfo();

  return (
    <LoadingScreenTemplate showTips>
      <div className="space-y-8 text-center">
        {motd ? <h2 className="text-2xl text-gray-600">{motd}</h2> : null}
        <h1 className="text-lg text-gray-600">
          Please navigate to the page you want to record, then press the blue record button.
        </h1>
      </div>
    </LoadingScreenTemplate>
  );
};

export default NewTab;
