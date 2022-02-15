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
    <div className="flex flex-row space-x-2 bg-gray-700 p-4 cursor-pointer" onClick={handleSettingsClick}>
      <AvatarImage src={picture} className="avatar h-8 w-8 rounded-full hover:cursor-pointer" />
      <div className="flex flex-col">
        <div className="overflow-hidden overflow-ellipsis whitespace-pre text-left text-sm text-white">
          {name}
        </div>
        <span className="text-left text-xs">
          View settings
        </span>
      </div>
    </div>
  );
}

const connector = connect(null, {
  setModal: actions.setModal,
});
export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(SidebarFooter);
