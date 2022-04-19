import React, { ReactNode } from "react";
import { connect, ConnectedProps } from "react-redux";

import LoadingScreen from "./shared/LoadingScreen";

interface PropsFromParent {
  slice: "inspector" | "messages";
  children: ReactNode;
  loading?: ReactNode;
}

function WaitForReduxSlice({ hasSlice, children, loading }: PropsFromParent & PropsFromRedux) {
  return hasSlice ? <>{children}</> : <>{loading}</> || <LoadingScreen />;
}

const connector = connect((state: any, { slice }: PropsFromParent) => ({
  hasSlice: !!state[slice],
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(WaitForReduxSlice);
