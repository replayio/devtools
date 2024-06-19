import assert from "assert";

import { config } from "shared/user-data/GraphQL/config";
import { ConfigurablePreference, PreferencesKey } from "shared/user-data/GraphQL/types";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";
import Checkbox from "ui/components/shared/Forms/Checkbox";
import { useGetUserInfo } from "ui/hooks/users";

export function BooleanPreference({
  onChange,
  preference,
  preferencesKey,
}: {
  onChange?: (value: boolean) => void;
  preference: ConfigurablePreference;
  preferencesKey: PreferencesKey;
}) {
  const { description, internalOnly, label } = preference;
  assert(label !== undefined);

  const { defaultValue } = config[preferencesKey];
  assert(typeof defaultValue === "boolean");

  const userInfo = useGetUserInfo();

  const [checked, setChecked] = useGraphQLUserData(preferencesKey);

  if (internalOnly && !userInfo.internal) {
    return null;
  } else if (checked === undefined) {
    return null;
  }

  const showWarningIcon = preference.highRisk && checked;

  return (
    <label
      className="flex cursor-pointer flex-col transition-opacity"
      style={{ gridTemplateColumns: "auto minmax(0, 1fr)", gap: "0 0.5rem" }}
      htmlFor={preferencesKey}
      onClick={() => {
        setChecked(!checked);

        if (onChange) {
          onChange(!checked);
        }
      }}
    >
      <div className="flex flex-row items-center gap-2">
        <Checkbox id={`BooleanPreference-${preferencesKey}`} checked={checked as boolean} />
        <div>{label}</div>
      </div>

      <div className="ml-6">
        {description ? (
          <div className="mb-1 text-xs text-bodySubColor" style={{ gridColumnStart: "2" }}>
            {description}
          </div>
        ) : null}
        {showWarningIcon && (
          <div className="mb-1 text-xs text-highRiskColor">
            <strong>Warning</strong>: this can significantly affect performance
          </div>
        )}
      </div>
    </label>
  );
}
