import {
  SelectedFrameContext,
  SelectedFrameContextRoot,
} from "bvaughn-architecture-demo/src/contexts/SelectedFrameContext";
import { getSelectedFrameId } from "devtools/client/debugger/src/selectors";
import { PropsWithChildren, useContext } from "react";
import { useAppSelector } from "ui/setup/hooks";

function SelectedFrameContextAdapter({ children }: PropsWithChildren) {
  const selectedPauseAndFrameIdRedux = useAppSelector(getSelectedFrameId);
  const { selectedPauseAndFrameId, setSelectedPauseAndFrameId } = useContext(SelectedFrameContext);
  if (selectedPauseAndFrameId !== selectedPauseAndFrameIdRedux) {
    setSelectedPauseAndFrameId(selectedPauseAndFrameId);
  }
  return <>{children}</>;
}

export default function SelectedFrameContextWrapper({ children }: PropsWithChildren<{}>) {
  return (
    <SelectedFrameContextRoot>
      <SelectedFrameContextAdapter />
      {children}
    </SelectedFrameContextRoot>
  );
}
