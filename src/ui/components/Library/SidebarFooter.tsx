import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { AvatarImage } from "../Avatar";
import { useGetUserInfo } from "ui/hooks/users";

function SidebarFooter({ setModal }: PropsFromRedux) {
  const { name, picture } = useGetUserInfo();

  const handleSettingsClick = () => {
    setModal("settings");
  };

  return (
    <div className="flex flex-row space-x-2 bg-gray-700 p-4">
      <AvatarImage src={picture} className="avatar h-8 w-8 rounded-full" />
      <div className="flex flex-col">
        <div className="overflow-hidden overflow-ellipsis whitespace-pre text-left text-sm text-white">
          {name}
        </div>
        <button className="text-left text-xs" onClick={handleSettingsClick}>
          View settings
        </button>
      </div>
    </div>
  );
}

const connector = connect(null, {
  setModal: actions.setModal,
});
export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(SidebarFooter);
