import { Frame, SourceId } from "@replayio/protocol";
import { ReactNode, Suspense, memo, useContext } from "react";

import { framesCache, topFrameCache } from "replay-next/src/suspense/FrameCache";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import {
  getCorrespondingLocations,
  getCorrespondingSourceIds,
} from "replay-next/src/utils/sources";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { SelectedFrameContext } from "../../src/contexts/SelectedFrameContext";
import styles from "./CurrentColumnHighlight.module.css";

type Props = {
  breakableColumnIndices: number[];
  lineNumber: number;
  plainText: string | null;
  showColumnBreakpoints: boolean;
  sourceId: SourceId;
};

export default memo(function CurrentColumnHighlight(props: Props) {
  return (
    <Suspense>
      <CurrentColumnHighlightSuspends {...props} />
    </Suspense>
  );
});

function CurrentColumnHighlightSuspends({
  breakableColumnIndices,
  lineNumber,
  plainText,
  showColumnBreakpoints,
  sourceId,
}: Props) {
  const client = useContext(ReplayClientContext);
  const { selectedPauseAndFrameId } = useContext(SelectedFrameContext);

  const frameId = selectedPauseAndFrameId?.frameId || null;
  const pauseId = selectedPauseAndFrameId?.pauseId || null;

  if (pauseId !== null && frameId !== null) {
    let highlightColumnBegin = -1;
    let highlightColumnEnd = -1;
    let columnBreakpointIndex = -1;

    // The 95% use case is that we'll be in the top frame. Start by fetching that.
    const topFrame = topFrameCache.read(client, pauseId);

    if (topFrame) {
      // Assuming there's at least a top frame, we can now see _which_ frame we're paused in.

      let selectedFrame: Frame | undefined = topFrame;
      if (selectedFrame?.frameId !== frameId) {
        // We must not be paused in the top frame. Get _all_ frames and find a match.
        // This is a more expensive request, so only fetch all frames if we have to.
        const allFrames = framesCache.read(client, pauseId);
        selectedFrame = allFrames?.find(frame => frame.frameId === frameId);
      }

      const sources = sourcesByIdCache.read(client);
      const correspondingSourceIds = getCorrespondingSourceIds(sources, sourceId);

      // Assuming we found a frame, check to see if there's a matching location for the frame.
      // If so, we should show the highlight line.
      const match = selectedFrame?.location.find(location => {
        if (correspondingSourceIds.includes(location.sourceId)) {
          const correspondingLocations = getCorrespondingLocations(sources, location);
          return (
            correspondingLocations.findIndex(
              correspondingLocation =>
                correspondingLocation.line === lineNumber &&
                correspondingLocation.sourceId === sourceId
            ) >= 0
          );
        }
      });
      if (match != null) {
        highlightColumnBegin = match.column;

        columnBreakpointIndex = breakableColumnIndices.findIndex(
          column => column === highlightColumnBegin
        );
        if (columnBreakpointIndex >= 0) {
          if (columnBreakpointIndex < breakableColumnIndices.length - 1) {
            highlightColumnEnd = breakableColumnIndices[columnBreakpointIndex + 1] - 1;
          } else if (plainText !== null) {
            highlightColumnEnd = plainText.length - 1;
          }
        }
      }
    }

    if (highlightColumnBegin > 0 && highlightColumnEnd > 0) {
      let children: ReactNode[] = [
        <div
          className={styles.LeadingSpacer}
          key={0}
          style={{
            width: `${highlightColumnBegin}ch`,
          }}
        />,
      ];

      if (showColumnBreakpoints) {
        for (let index = 0; index < breakableColumnIndices.length; index++) {
          const breakableColumnIndex = breakableColumnIndices[index];

          if (breakableColumnIndex <= highlightColumnBegin) {
            children.push(<div className={styles.ColumnBreakpointSpacer} key={children.length} />);
          } else {
            break;
          }
        }
      }

      children.push(
        <div
          className={styles.Highlight}
          key={children.length}
          style={{
            // @ts-ignore
            width: `${highlightColumnEnd - highlightColumnBegin}ch`,
          }}
        />
      );

      return <div className={styles.Container}>{children}</div>;
    }
  }

  console.log("BAIL 2");
  return null;
}
