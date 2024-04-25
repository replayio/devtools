import {
  Location,
  PointDescription,
  RunEvaluationResult,
  TimeStampedPoint,
} from "@replayio/protocol";

import { recordingTargetCache } from "replay-next/src/suspense/BuildIdCache";
import { createFocusIntervalCacheForExecutionPoints } from "replay-next/src/suspense/FocusIntervalCache";
import { hitPointsForLocationCache } from "replay-next/src/suspense/HitPointsCache";
import { mappedExpressionCache } from "replay-next/src/suspense/MappedExpressionCache";
import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import { compareExecutionPoints } from "replay-next/src/utils/time";
import { ReplayClientInterface } from "shared/client/types";
import { ProtocolError, ProtocolRequest, ProtocolResponse } from "ui/reducers/protocolMessages";
import { SourceDetails, SourcesState, getPreferredLocation } from "ui/reducers/sources";
import { deserializeChunkedString } from "ui/utils/evalChunkedStrings";

export type RecordedProtocolData = {
  id: number;
  point: TimeStampedPoint;
  recordedAt: number;
} & (
  | { type: "error"; value: ProtocolError }
  | { type: "request"; value: ProtocolRequest }
  | { type: "response"; value: ProtocolResponse }
);

export const recordedProtocolMessagesCache = createFocusIntervalCacheForExecutionPoints<
  [replayClient: ReplayClientInterface, sessionSource: SourceDetails, sourcesState: SourcesState],
  RecordedProtocolData
>({
  debugLabel: "RecordedProtocolMessages",
  getPointForValue: data => data.point.point,
  async load(rangeStart, rangeEnd, replayClient, sessionSource, sourcesState) {
    const symbols = await sourceOutlineCache.readAsync(replayClient, sessionSource.id);
    const recordingTarget = await recordingTargetCache.readAsync(replayClient);

    const mapNamesToCallbackNames = {
      requestMap: "onRequest",
      responseMap: "onResponse",
      errorMap: "onResponseError",
    } as const;

    const argNames = {
      onRequest: "request",
      onResponse: "response",
      onResponseError: "error",
    } as const;

    const promises = Object.entries(mapNamesToCallbackNames).map(
      async ([fieldName, functionName]) => {
        // Start by finding the parsed listing for this function
        const functionEntry = symbols?.functions.find(entry => entry.name === functionName);

        if (!functionEntry) {
          return [];
        }

        const firstBreakablePosition = functionEntry.breakpointLocation;

        if (!firstBreakablePosition) {
          return [];
        }

        const position: Location = {
          sourceId: sessionSource.id,
          line: firstBreakablePosition.line,
          column: firstBreakablePosition.column,
        };

        // Get all the times that first line was hit
        const [hitPoints] = await hitPointsForLocationCache.readAsync(
          replayClient,
          {
            begin: rangeStart,
            end: rangeEnd,
          },
          position,
          null
        );

        const pointDescriptions = hitPoints as PointDescription[];

        if (pointDescriptions.length === 0) {
          return [];
        }

        const preferredLocation = getPreferredLocation(
          sourcesState,
          pointDescriptions[0].frame ?? []
        );

        if (!preferredLocation) {
          return [];
        }

        // Make sure we use the in-scope variable name here.
        // Note that the expression often has `;` appended,
        // so remove that.
        const mappedExpression = (
          await mappedExpressionCache.readAsync(
            replayClient,
            argNames[functionName],
            preferredLocation
          )
        ).replace(";", "");

        // Now the ugly part. We need to serialize a potentially large
        // JS object representing the protocol req/res/err.
        // However, `runEvaluation` only returns a single level of
        // object previews, as I found out while working on routines.
        // The workaround is to call `JSON.stringify()` in the eval.
        // BUT, Chromium has a 10K-character limit for strings.
        // So, we break the string into 9999-char chunks, and stuff
        // all those into a single array, and return _that_ from the eval.
        // `serializeArgument` will be evaluated in the paused browser.
        type ChunksArray = (string | number)[];
        function serializeArgument(arg: any) {
          // Gotta define this inline, since this whole function
          // will be evaluated
          function splitStringIntoChunks(allChunks: ChunksArray, str: string) {
            // Split the stringified data into chunks
            const stringChunks: string[] = [];
            for (let i = 0; i < str.length; i += 9999) {
              stringChunks.push(str.slice(i, i + 9999));
            }

            // If there's more than one string chunk, save its size
            if (stringChunks.length > 1) {
              allChunks.push(stringChunks.length);
            }

            for (const chunk of stringChunks) {
              allChunks.push(chunk);
            }
            return stringChunks.length;
          }

          const stringifiedArg = JSON.stringify(arg);
          const chunks: ChunksArray = [];

          splitStringIntoChunks(chunks, stringifiedArg);

          return chunks;
        }

        const evalResults: RunEvaluationResult[] = [];
        await replayClient.runEvaluation(
          {
            // Run `serializeArgument` in an eval, and pass in the local variable
            // as the argument to serialize
            expression: `
              (${serializeArgument})(${mappedExpression})
            `,
            limits: {
              begin: rangeStart,
              end: rangeEnd,
              maxCount: 1000,
            },
            frameIndex: 0,
            fullPropertyPreview: true,
            selector: {
              kind: "points",
              points: pointDescriptions.map(hp => hp.point),
            },
            shareProcesses: recordingTarget === "chromium",
          },
          results => {
            evalResults.push(...results);
          }
        );

        evalResults.sort((a, b) => compareExecutionPoints(a.point.point, b.point.point));

        const allProtocolData = evalResults
          .map(evalResult => {
            const { data, point, returned } = evalResult;
            if (!returned?.object) {
              return undefined;
            }

            const obj = data.objects?.find(o => o.objectId === returned.object);
            if (!obj) {
              return;
            }

            const properties = obj.preview?.properties ?? [];
            const remainingProperties = properties.filter(prop => {
              const expectedIndex = Number.parseInt(prop.name);

              if (prop.isSymbol || !Number.isInteger(expectedIndex)) {
                // Array preview won't normally hit this case, but since this code is
                // currently running on the user's actual page content, they may have
                // overloaded properties on Array.prototype that could show up here.
                return false;
              }

              return true;
            });

            const fullString = deserializeChunkedString(remainingProperties);
            const parsedObject = JSON.parse(fullString) as
              | ProtocolRequest
              | ProtocolResponse
              | ProtocolError;

            parsedObject.recordedAt = point.time;

            // @ts-ignore doesn't like the unioned `value` field
            const recordedProtocolData: RecordedProtocolData = {
              id: parsedObject.id,
              point,
              recordedAt: point.time,
              type: argNames[functionName],
              value: parsedObject,
            };

            return recordedProtocolData;
          })
          .filter(b => !!b) as RecordedProtocolData[];

        return allProtocolData;
      }
    );

    const results = (await Promise.all(promises)).flat();
    results.sort((a, b) => compareExecutionPoints(a.point.point, b.point.point));
    return results;
  },
});
