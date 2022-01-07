import React from "react";
import { connect, ConnectedProps } from "react-redux";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { trackEvent } from "ui/utils/telemetry";
const { openQuickOpen } = require("devtools/client/debugger/src/actions/quick-open");

function QuickOpenButton({ openQuickOpen }: PropsFromRedux) {
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openQuickOpen();
    trackEvent("quick_open.open_quick_open");
  };

  return (
    <button className="flex text-xs p-0.5 rounded-full hover:bg-gray-200" onClick={onClick}>
      <MaterialIcon>search</MaterialIcon>
    </button>
  );
}

const connector = connect(() => ({}), {
  openQuickOpen,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(QuickOpenButton);
