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
        <>
          Advanced
          <MaterialIcon
            className={classNames("material-warning-icon", showWarningIcon || "invisible")}
            iconSize="lg"
          >
            warning
          </MaterialIcon>
        </>
      );
  }
}
