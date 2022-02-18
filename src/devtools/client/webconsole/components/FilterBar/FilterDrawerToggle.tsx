import React from "react";
import { connect, ConnectedProps } from "react-redux";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { UIState } from "ui/state";
import { getAllUi } from "../../selectors/ui";
import Icon from "ui/components/shared/Icon";
const actions = require("devtools/client/webconsole/actions/index");

function FilterDrawerToggle({ collapseFilterDrawer, toggleFilterDrawer }: PropsFromRedux) {
  const onClick = () => {
    toggleFilterDrawer();
  };
  return (
    <div
      className="flex flex-row items-center justify-start"
      style={!collapseFilterDrawer ? { width: "calc(var(--console-drawer-width) - 1rem)" } : {}}
    >
      <button className="console-filter-toggle" onClick={onClick}>
        <Icon filename="drawer" className="bg-iconColor hover:bg-primaryAccent" />
      </button>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    collapseFilterDrawer: getAllUi(state).collapseFilterDrawer,
  }),
  {
    toggleFilterDrawer: actions.toggleFilterDrawer,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(FilterDrawerToggle);
