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
    <div className="flex flex-row space-x-3 items-center">
      <input
        type="checkbox"
        checked={isPublic}
        onChange={() => setIsPublic(!isPublic)}
        id="privacy"
      />
      <label htmlFor="privacy">Anyone with this link can view</label>
    </div>
  );
}
