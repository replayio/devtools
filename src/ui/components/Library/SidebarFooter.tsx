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
    <div className="flex flex-row space-x-2 p-4 bg-gray-700">
      <AvatarImage src={picture} className="rounded-full w-8 h-8 avatar" />
      <div className="flex flex-col">
        <div className="text-sm text-white overflow-hidden overflow-ellipsis whitespace-pre text-left">
          {name}
        </div>
        <button className="text-xs text-left" onClick={handleSettingsClick}>
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
