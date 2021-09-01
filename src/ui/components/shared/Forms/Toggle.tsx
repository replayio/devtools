import React from "react";
import { Switch } from "@headlessui/react";
import classnames from "classnames";

export default function Toggle({
  enabled,
  setEnabled,
}: {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}) {
  return (
    <Switch
      checked={enabled}
      onChange={setEnabled}
      className={classnames(
        enabled ? "bg-green-600" : "bg-gray-200",
        "relative inline-flex flex-shrink-0 h-4 w-8 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent"
      )}
    >
      <span
        aria-hidden="true"
        className={classnames(
          enabled ? "translate-x-5" : "translate-x-0",
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
        )}
      />
    </Switch>
  );
}
