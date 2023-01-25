import { Switch } from "@headlessui/react";
import classNames from "classnames";

export default function Toggle({
  enabled,
  setEnabled,
  disabled,
}: {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  disabled?: boolean;
}) {
  const onChange = (value: boolean) => {
    if (disabled) {
      return;
    }

    setEnabled(value);
  };

  return (
    <div className={classNames({ "pointer-events-none": disabled })}>
      <Switch
        checked={enabled}
        onChange={onChange}
        className={classNames(
          enabled ? "bg-primaryAccent" : "bg-themeToggleBgcolor",
          "relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2"
        )}
      >
        <span
          aria-hidden="true"
          className={classNames(
            enabled ? "translate-x-3" : "translate-x-0",
            "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
          )}
        />
      </Switch>
    </div>
  );
}
