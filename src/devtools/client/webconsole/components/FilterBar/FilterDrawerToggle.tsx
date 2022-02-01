import React from "react";
import { connect, ConnectedProps } from "react-redux";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { UIState } from "ui/state";
import { getAllUi } from "../../selectors/ui";
import { ReactComponent as Butt } from "/public/images/palette.svg";
const actions = require("devtools/client/webconsole/actions/index");

function FilterDrawerToggle({ collapseFilterDrawer, toggleFilterDrawer }: PropsFromRedux) {
  const onClick = () => {
    toggleFilterDrawer();
  };
  return (
    <div
      className="flex flex-row justify-start items-center"
      style={!collapseFilterDrawer ? { width: "calc(var(--console-drawer-width) - 1rem)" } : {}}
    >
      <Butt />
      <button className="flex border border-bodyColor rounded-md" onClick={onClick}>
        <MaterialIcon>{collapseFilterDrawer ? "chevron_right" : "chevron_left"}</MaterialIcon>
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
