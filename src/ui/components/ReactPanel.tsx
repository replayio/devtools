import { Location, SameLineSourceLocations, TimeStampedPointRange } from "@replayio/protocol";
import { useContext } from "react";

import AccessibleImage from "devtools/client/debugger/src/components/shared/AccessibleImage";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { getFramesAsync } from "replay-next/src/suspense/FrameCache";
import { getHitPointsForLocationAsync } from "replay-next/src/suspense/HitPointsCache";
import { getPauseIdAsync } from "replay-next/src/suspense/PauseCache";
import { getScopeMapAsync } from "replay-next/src/suspense/ScopeMapCache";
import { getBreakpointPositionsAsync } from "replay-next/src/suspense/SourcesCache";
import { UIThunkAction } from "ui/actions";
import {
  IGNORABLE_PARTIAL_SOURCE_URLS,
  shouldIgnoreEventFromSource,
} from "ui/actions/event-listeners";
import {
  getAllSourceDetails,
  getGeneratedLocation,
  getPreferredLocation,
  getSourceDetailsEntities,
  getSourceIdsByUrl,
  getSourceToDisplayForUrl,
} from "ui/reducers/sources";
import { useAppDispatch } from "ui/setup/hooks";
import { getSymbolsAsync } from "ui/suspense/sourceCaches";

import { findFirstBreakablePositionForFunction } from "./Events/Event";

const MORE_IGNORABLE_PARTIAL_URLS = IGNORABLE_PARTIAL_SOURCE_URLS.concat(
  // Ignore _any_ 3rd-party package for now
  "node_modules"
);

function findQueuedRendersForRange(range: TimeStampedPointRange): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    const sourcesByUrl = getSourceIdsByUrl(getState());
    const sourcesById = getSourceDetailsEntities(getState());
    const allSources = getAllSourceDetails(getState());
    const sourcesState = getState().sources;
    const reactDomDevUrl = Object.keys(sourcesByUrl).find(key => {
      return key.includes("react-dom.development");
    });

    if (!reactDomDevUrl) {
      return;
    }

    const preferredSource = getSourceToDisplayForUrl(getState(), reactDomDevUrl);
    if (!preferredSource) {
      return;
    }
    const [symbols, breakablePositionsResult] = await Promise.all([
      getSymbolsAsync(preferredSource.id, allSources, replayClient),
      getBreakpointPositionsAsync(preferredSource.id, replayClient),
    ]);
    const [breakablePositions, breakablePositionsByLine] = breakablePositionsResult;
    const shouldUpdateFiberSymbol = symbols?.functions.find(
      f => f.name === "scheduleUpdateOnFiber"
    )!;

    const firstBreakablePosition = findFirstBreakablePositionForFunction(
      { ...shouldUpdateFiberSymbol.location.start, sourceId: preferredSource.id },
      breakablePositionsByLine
    );
    if (!firstBreakablePosition) {
      return;
    }
    console.log("First breakable position: ", firstBreakablePosition);

    const [hitPoints] = await getHitPointsForLocationAsync(
      replayClient,
      firstBreakablePosition,
      null,
      { begin: range.begin.point, end: range.end.point }
    );
    console.log("Hit points: ", hitPoints);

    const hitPointsToCheck = hitPoints.slice(0, 3);
    const queuedRenders = await Promise.all(
      hitPointsToCheck.map(async hitPoint => {
        const pauseId = await getPauseIdAsync(replayClient, hitPoint.point, hitPoint.time);

        const frames = (await getFramesAsync(pauseId, replayClient)) ?? [];

        const formattedFrames = await Promise.all(
          frames.map(async frame => {
            const { functionLocation = [], functionName = "" } = frame;
            let location: Location | undefined = undefined;
            let locationUrl: string | undefined = undefined;
            if (functionLocation) {
              location = getPreferredLocation(sourcesState, functionLocation);

              locationUrl =
                functionLocation?.length > 0 ? sourcesById[location.sourceId]?.url : undefined;
            }

            const scopeMap = await getScopeMapAsync(
              getGeneratedLocation(sourcesById, functionLocation),
              replayClient
            );
            const originalFunctionName = scopeMap?.find(
              mapping => mapping[0] === functionName
            )?.[1];
            return {
              location,
              locationUrl,
              functionName,
              originalFunctionName,
              source: location ? sourcesById[location.sourceId] : undefined,
            };
          })
        );

        const filteredFrames = formattedFrames.filter(entry => {
          if (!entry.locationUrl) {
            return false;
          }
          return !MORE_IGNORABLE_PARTIAL_URLS.some(partialUrl =>
            entry.locationUrl!.includes(partialUrl)
          );
        });

        return {
          frames,
          formattedFrames,
          filteredFrames,
        };
      })
    );

    console.log("Queued renders: ", queuedRenders);
  };
}

export function ReactPanel() {
  const dispatch = useAppDispatch();
  const { rangeForDisplay: focusRange } = useContext(FocusContext);

  const handleClick = () => {
    console.log("Focus range: ", focusRange);
    dispatch(findQueuedRendersForRange(focusRange!));
  };

  return (
    <div>
      <div
        className="text-xl"
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        React Renders <AccessibleImage className="annotation-logo react" />
      </div>
      <div>
        <button
          type="button"
          onClick={handleClick}
          className="mr-0 flex items-center space-x-1.5 rounded-lg bg-primaryAccent text-buttontextColor hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2"
          style={{ padding: "5px 12px" }}
        >
          Find React Renders
        </button>
      </div>
    </div>
  );
}
