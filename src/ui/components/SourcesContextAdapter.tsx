import {
  SourcesContext,
  SourcesContextRoot,
} from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { getShownSource } from "devtools/client/debugger/src/selectors";
import { ReactNode, useContext, useLayoutEffect } from "react";
import { useAppSelector } from "ui/setup/hooks";

// Relays information about the active source from Redux to the newer SourcesContext.
// This information is consumed, along with other state (like the hovered line number) by the PointsContext.
export default function SourcesContextWrapper({ children }: { children: ReactNode }) {
  return (
    <SourcesContextRoot>
      <SourcesContextAdapter>{children}</SourcesContextAdapter>
    </SourcesContextRoot>
  );
}

function SourcesContextAdapter({ children }: { children: ReactNode }) {
  const shownSource = useAppSelector(getShownSource);
  const shownSourceId = shownSource ? shownSource.id : null;

  const { closeSource, focusedSourceId, openSource } = useContext(SourcesContext);

  useLayoutEffect(() => {
    if (shownSourceId === null) {
      if (focusedSourceId !== null) {
        closeSource(focusedSourceId);
      }
    } else {
      openSource(shownSourceId);
    }
  }, [closeSource, focusedSourceId, openSource, shownSourceId]);

  return children as any;
}
