import React, { ReactNode } from "react";
import { connect, ConnectedProps } from "react-redux";
import LoadingScreen from "./shared/LoadingScreen";

interface PropsFromParent {
  slice: string;
  children: ReactNode;
}

function WaitForReduxSlice({ hasSlice, children }: PropsFromParent & PropsFromRedux) {
  return hasSlice ? <>{children}</> : <LoadingScreen />;
}

const connector = connect((state: any, { slice }: PropsFromParent) => ({
  hasSlice: !!state[slice],
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(WaitForReduxSlice);
