import React from "react";
import { setModal } from "ui/actions/app";
import { AvatarImage } from "ui/components/Avatar";
import { useGetUserInfo } from "ui/hooks/users";
import { useAppDispatch } from "ui/setup/hooks";

export default function Profile() {
  const dispatch = useAppDispatch();
  const { name, picture } = useGetUserInfo();

  const handleSettingsClick = () => {
    dispatch(setModal("settings"));
  };

  return (
    <button className="flex flex-row p-4 space-x-2 bg-black/20" onClick={handleSettingsClick}>
      <AvatarImage src={picture} className="w-8 h-8 rounded-full avatar hover:cursor-pointer" />
      <div className="flex flex-col">
        <div className="overflow-hidden text-sm text-left text-white whitespace-pre overflow-ellipsis">
          {name}
        </div>
        <span className="text-xs text-left">View settings</span>
      </div>
    </button>
  );
}
