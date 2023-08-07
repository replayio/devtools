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
    <button
      className="flex flex-row space-x-2 border-t border-gray-600 bg-black/20 p-4"
      onClick={handleSettingsClick}
    >
      <AvatarImage src={picture} className="avatar h-8 w-8 rounded-full hover:cursor-pointer" />
      <div className="flex flex-col">
        <div className="overflow-hidden overflow-ellipsis whitespace-pre text-left text-sm text-white">
          {name}
        </div>
        <span className="text-left text-xs">View settings</span>
      </div>
    </button>
  );
}
