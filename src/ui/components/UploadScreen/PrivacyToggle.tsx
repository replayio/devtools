import React, { Dispatch, SetStateAction } from "react";
import { Toggle } from "ui/components/shared/Forms";

export default function PrivacyToggle({
  isPublic,
  setIsPublic,
}: {
  isPublic: boolean;
  setIsPublic: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <div className="flex flex-row space-x-4 items-center">
      <Toggle enabled={isPublic} setEnabled={setIsPublic} />
      <div>Anyone with this link can view</div>
    </div>
  );
}
