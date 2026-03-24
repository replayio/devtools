import classNames from "classnames";

import { useHighRiskSettingCount } from "shared/user-data/GraphQL/useHighRiskSettingCount";
import MaterialIcon from "ui/components/shared/MaterialIcon";

export function Advanced({ location }: { location: "body" | "navigation" }) {
  const showWarningIcon = useHighRiskSettingCount() > 0;

  switch (location) {
    case "body":
      return (
        <div>
          Advanced
          {showWarningIcon && (
            <div className="mb-1 text-xs text-highRiskColor">
              <strong>Warning</strong> Some of the selected settings may affect performance
            </div>
          )}
        </div>
      );
    case "navigation":
      return (
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="truncate">Advanced</span>
          <MaterialIcon
            className={classNames("material-warning-icon shrink-0", showWarningIcon || "invisible")}
            iconSize="base"
          >
            warning
          </MaterialIcon>
        </span>
      );
  }
}
