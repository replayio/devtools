import React from "react";
import { ConnectedProps, connect } from "react-redux";

import { openQuickOpen } from "devtools/client/debugger/src/actions/quick-open";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { trackEvent } from "ui/utils/telemetry";

function QuickOpenButton({ openQuickOpen }: PropsFromRedux) {
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openQuickOpen();
    trackEvent("quick_open.open_quick_open");
  };

  return (
    <button
      className="flex rounded-full p-0.5 text-xs hover:bg-breakpointStatusBG"
      onClick={onClick}
    >
      <MaterialIcon>search</MaterialIcon>
    </button>
  );
}

const connector = connect(null, {
  openQuickOpen,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(QuickOpenButton);
