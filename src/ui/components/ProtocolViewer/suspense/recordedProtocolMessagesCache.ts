import { Location, PointRange, Value as ProtocolValue } from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { breakpointPositionsCache } from "replay-next/src/suspense/BreakpointPositionsCache";
import { hitPointsForLocationCache } from "replay-next/src/suspense/HitPointsCache";
import {
  LogPointAnalysisResult,
  getLogPointAnalysisResultAsync,
} from "replay-next/src/suspense/LogPointAnalysisCache";
import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import { ReplayClientInterface } from "shared/client/types";
import { AllProtocolMessages, ProtocolMessageCommon } from "ui/components/ProtocolViewer/types";
import { SourceDetails } from "ui/reducers/sources";
import { getJSON } from "ui/utils/objectFetching";

const NO_PROTOCOL_MESSAGES: AllProtocolMessages = {
  requestMap: {},
  responseMap: {},
  errorMap: {},
};

export const recordedProtocolMessagesCache: Cache<
  [replayClient: ReplayClientInterface, sourceDetails: SourceDetails[], range: PointRange],
  AllProtocolMessages
> = createCache({
  config: { immutable: true },
  debugLabel: "RecordedPotocolMessages",
  getKey: ([replayClient, sourceDetails, range]) => `${range.begin}-${range.end}`,
  load: async ([replayClient, sourceDetails, range]) => {
    const sessionSource = sourceDetails.find(source => source.url?.includes("ui/actions/session"));

    if (!sessionSource) {
      return NO_PROTOCOL_MESSAGES;
    }

    const [breakablePositionsSorted] = await breakpointPositionsCache.readAsync(
      replayClient,
      sessionSource.id
    );
    const symbols = await sourceOutlineCache.readAsync(replayClient, sessionSource.id);

    const mapNamesToCallbackNames: Record<keyof AllProtocolMessages, string> = {
      requestMap: "onRequest",
      responseMap: "onResponse",
      errorMap: "onResponseError",
    };

    const results = { ...NO_PROTOCOL_MESSAGES };

    const promises = Object.entries(mapNamesToCallbackNames).map(
      async ([fieldName, functionName]) => {
        // Start by finding the parsed listing for this function
        const functionEntry = symbols?.functions.find(entry => entry.name === functionName);

        if (!functionEntry) {
          return;
        }

        const { begin, end } = functionEntry.location;

        // There should be a breakable position starting on the next line
        const firstBreakablePosition = breakablePositionsSorted.find(
          bp => bp.line > begin.line && bp.line < end.line
        );

        if (!firstBreakablePosition) {
          return;
        }
        const position: Location = {
          sourceId: sessionSource.id,
          line: firstBreakablePosition.line,
          column: firstBreakablePosition.columns[0],
        };

        // Get all the times that first line was hit
        const [hitPoints] = await hitPointsForLocationCache.readAsync(
          replayClient,
          range,
          position,
          null
        );

        // For every hit, grab the first arg, which should be the `event`
        // that is either the request, response, or error data
        const hitPointsWithResults = (
          await Promise.all(
            hitPoints.map(hp =>
              getLogPointAnalysisResultAsync(
                replayClient,
                range,
                hp,
                position,
                "[...arguments][0]",
                null
              )
            )
          )
        ).filter(b => !!b) as LogPointAnalysisResult[];

        // For every analysis result, download the entire event object
        // as a real JS object, and add the relevant timestamp
        const events = await Promise.all(
          hitPointsWithResults.map(async analysisResult => {
            const values: ProtocolValue[] = analysisResult.values;
            const [eventValue] = values;

            // @ts-ignore
            let parsedObject: ProtocolMessageCommon = {};

            if (eventValue?.object) {
              parsedObject = (await getJSON(
                replayClient,
                analysisResult.pauseId!,
                eventValue
              )) as unknown as ProtocolMessageCommon;
            }

            parsedObject.recordedAt = analysisResult.time;

            return parsedObject;
          })
        );

        const eventsById: Record<string, ProtocolMessageCommon> = {};

        // The `<ProtocolViewer>` wants these normalized by ID
        events.forEach(event => {
          eventsById[event.id] = event;
        });

        // @ts-ignore it wants specific field names, not `string`
        results[fieldName] = eventsById;
      }
    );

    await Promise.all(promises);

    return results;
  },
});
