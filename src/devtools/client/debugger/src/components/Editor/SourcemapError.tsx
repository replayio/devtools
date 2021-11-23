import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";

function SourcemapError({ setModal }: PropsFromRedux) {
  const onClick = () => {
    setModal("sourcemap-setup");
  };

  return (
    <div className="flex items-center space-x-1" onClick={onClick}>
      <span>No sourcemaps found.</span>
      <button className="underline">Learn more</button>
    </div>
  );
}

const connector = connect(null, {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SourcemapError);
