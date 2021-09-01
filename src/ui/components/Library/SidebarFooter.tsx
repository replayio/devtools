import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";

function SidebarFooter({ setModal }: PropsFromRedux) {
  const { user } = useAuth0();
  const { name, picture } = user!;

  const handleSettingsClick = () => {
    setModal("settings");
  };

  return (
    <div className="flex flex-row space-x-2 p-4 bg-gray-700">
      <img src={picture} className="rounded-full w-8 h-8" />
      <div className="flex flex-col">
        <div className="text-sm text-white overflow-hidden overflow-ellipsis whitespace-pre">
          {name}
        </div>
        <button className="text-xs" onClick={handleSettingsClick}>
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
