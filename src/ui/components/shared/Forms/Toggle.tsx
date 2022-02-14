import React, { Dispatch, SetStateAction } from "react";
import { Switch } from "@headlessui/react";
import classNames from "classnames";

export default function Toggle({
  enabled,
  setEnabled,
}: {
  enabled: boolean;
  setEnabled: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <Switch
      checked={enabled}
      onChange={setEnabled}
      className={classNames(
        enabled ? "bg-primaryAccent" : "bg-gray-200",
        "relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent"
      )}
    >
      <span
        aria-hidden="true"
        className={classNames(
          enabled ? "translate-x-5" : "translate-x-0",
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
        )}
      />
    </Switch>
  );
}
