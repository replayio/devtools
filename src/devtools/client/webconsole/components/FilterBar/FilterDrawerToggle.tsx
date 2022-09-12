import classNames from "classnames";
import React, { FC } from "react";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { setConsoleFilterDrawerExpanded } from "ui/actions/layout";
import Icon from "ui/components/shared/Icon";
import { getConsoleFilterDrawerExpanded } from "ui/reducers/layout";

export const FilterDrawerToggle: FC = () => {
  const expanded = useAppSelector(getConsoleFilterDrawerExpanded);
  const dispatch = useAppDispatch();

  const onClick = () => {
    dispatch(setConsoleFilterDrawerExpanded(!expanded));
  };

  return (
    <div
      className="flex flex-row items-center justify-start"
      style={expanded ? { width: "calc(var(--console-drawer-width) - 1rem)" } : {}}
    >
      <button className="console-filter-toggle" onClick={onClick}>
        <Icon
          filename="drawer"
          className={classNames(
            "hover:bg-primaryAccent",
            expanded ? "bg-primaryAccent" : "bg-iconColor"
          )}
        />
      </button>
    </div>
  );
};
