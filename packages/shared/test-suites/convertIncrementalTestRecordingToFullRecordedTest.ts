import assert from "assert";
import {
  ExecutionPoint,
  RequestEvent,
  RequestOpenEvent,
  RequestResponseEvent,
  TimeStampedPoint,
} from "@replayio/protocol";

import { comparePoints } from "protocol/execution-point-utils";
import { networkRequestsCache } from "replay-next/src/suspense/NetworkRequestsCache";
import { findSliceIndices, insert } from "replay-next/src/utils/array";
import { ReplayClientInterface } from "shared/client/types";
import { Annotation } from "shared/graphql/types";

import {
  IncrementalTestRecording,
  NavigationEvent,
  NetworkRequestEvent,
  TestRecording,
  TestSectionName,
  getExecutionPoint,
  isIncrementalIncrementalTestRecording,
  isTest,
} from "./types";

export async function convertIncrementalTestRecordingToFullRecordedTest(
  testRecording: IncrementalTestRecording | TestRecording,
  annotations: Annotation[],
  replayClient: ReplayClientInterface
): Promise<TestRecording> {
  if (isIncrementalIncrementalTestRecording(testRecording)) {
    const { error, events: partialEvents, result, source } = testRecording;

    const events: TestRecording["events"] = {
      afterAll: [],
      afterEach: [],
      beforeAll: [],
      beforeEach: [],
      main: [],
    };

    let beginPoint: TimeStampedPoint | null = null;
    let endPoint: TimeStampedPoint | null = null;

    const navigationEvents: NavigationEvent[] = [];

    // Note that event annotations may be interleaved,
    // meaning that we can't step through both arrays in one pass.
    // Instead we have to loop over the annotations array once to group data by event id–
    // (and also find the navigation and test start/end annotations)–
    // then we can iterate over the user-action events.
    const userActionEventIdToAnnotations: Record<string, Annotation[]> = {};
    for (let index = 0; index < annotations.length; index++) {
      const annotation = annotations[index];
      switch (annotation.message.event) {
        case "event:navigation": {
          assert(annotation.message.url, "Navigation annotation must have a URL");

          const navigationEvent: NavigationEvent = {
            data: {
              url: annotation.message.url,
            },
            timeStampedPoint: {
              point: annotation.point,
              time: annotation.time,
            },
            type: "navigation",
          };

          navigationEvents.push(navigationEvent);
          break;
        }
        case "step:end":
        case "step:enqueue":
        case "step:start": {
          const id = annotation.message.id;
          assert(id != null, "Annotation event must have an id");
          if (userActionEventIdToAnnotations[id] == null) {
            userActionEventIdToAnnotations[id] = [annotation];
          } else {
            userActionEventIdToAnnotations[id].push(annotation);
          }
          break;
        }
        case "test:start": {
          beginPoint = {
            point: annotation.point,
            time: annotation.time,
          };
          break;
        }
        case "test:end": {
          endPoint = {
            point: annotation.point,
            time: annotation.time,
          };
          break;
        }
        default: {
          console.warn(`Unexpected annotation type: ${annotation.message.event}`);
        }
      }
    }

    assert(beginPoint !== null, "Test must have a begin point");
    assert(endPoint !== null, "Test must have a end point");

    for (let sectionName in partialEvents) {
      const testEvents = events[sectionName as TestSectionName];

      const partialTestEvents = partialEvents[sectionName as TestSectionName];
      partialTestEvents.forEach(partialTestEvent => {
        const {
          category,
          command,
          error = null,
          id,
          parentId = null,
          scope = null,
        } = partialTestEvent.data;

        assert(category, `Test event must have "category" property`);
        assert(command, `Test event must have "command" property`);
        assert(id, `Test event must have "id" property`);

        const annotations = userActionEventIdToAnnotations[id];

        assert(annotations != null, `Missing annotations for test event ${id}`);

        let beginPoint: TimeStampedPoint | null = null;
        let endPoint: TimeStampedPoint | null = null;
        let resultPoint: TimeStampedPoint | null = null;
        let resultVariable: string | null = null;
        let viewSourceTimeStampedPoint: TimeStampedPoint | null = null;

        const isChaiAssertion = command.name === "assert";

        annotations.forEach(annotation => {
          switch (annotation.message.event) {
            case "step:end": {
              endPoint = {
                point: annotation.point,
                time: annotation.time,
              };

              resultPoint = {
                point: annotation.point,
                time: annotation.time,
              };
              resultVariable = annotation.message.logVariable ?? null;

              if (isChaiAssertion) {
                viewSourceTimeStampedPoint = {
                  point: annotation.point,
                  time: annotation.time,
                };
              }
              break;
            }
            case "step:enqueue": {
              if (!isChaiAssertion) {
                viewSourceTimeStampedPoint = {
                  point: annotation.point,
                  time: annotation.time,
                };
              }
              break;
            }
            case "step:start": {
              beginPoint = {
                point: annotation.point,
                time: annotation.time,
              };
              break;
            }
          }
        });

        assert(beginPoint !== null, `Missing "step:start" annotation for test event`);
        assert(endPoint !== null, `Missing "step:end" annotation for test event`);
        assert(resultPoint !== null, `Missing "step:end" annotation for test event`);
        assert(
          viewSourceTimeStampedPoint !== null,
          `Missing ${isChaiAssertion ? "step:start" : "step:enqueue"} annotation for test event`
        );

        testEvents.push({
          data: {
            category: category,
            command: {
              arguments: command.arguments,
              name: command.name,
            },
            error,
            id,
            parentId,
            result: resultVariable
              ? {
                  timeStampedPoint: resultPoint,
                  variable: resultVariable,
                }
              : null,
            scope,
            viewSourceTimeStampedPoint,
          },
          timeStampedPointRange: {
            begin: beginPoint,
            end: endPoint,
          },
          type: "user-action",
        });
      });
    }

    // Finds the section that contains a given point
    // defaults to the main (test body) section if no matches found
    const findSection = (point: ExecutionPoint) => {
      const sections = Object.values(events);
      for (let index = sections.length - 1; index >= 0; index--) {
        const events = sections[index];
        const firstEvent = events[0];
        if (firstEvent && comparePoints(getExecutionPoint(firstEvent), point) <= 0) {
          return events;
        }
      }
      return events.main;
    };

    const networkRequestEvents = await processNetworkData(replayClient, beginPoint, endPoint);
    // Now that section boundaries have been defined by user-actions,
    // merge in navigation and network events.
    navigationEvents.forEach(navigationEvent => {
      const events = findSection(navigationEvent.timeStampedPoint.point);
      insert(events, navigationEvent, (a, b) =>
        comparePoints(getExecutionPoint(a), getExecutionPoint(b))
      );
    });
    networkRequestEvents.forEach(networkRequestEvent => {
      const events = findSection(networkRequestEvent.timeStampedPoint.point);
      insert(events, networkRequestEvent, (a, b) =>
        comparePoints(getExecutionPoint(a), getExecutionPoint(b))
      );
    });

    return {
      error,
      events,
      result,
      source,
      timeStampedPointRange: {
        begin: beginPoint,
        end: endPoint,
      },
    };
  } else if (isTest(testRecording)) {
    return testRecording;
  } else {
    // This function does not support the legacy TestItem format
    throw Error(`Unsupported legacy TestItem value`);
  }
}

function isRequestOpenEvent(value: RequestEvent): value is RequestOpenEvent {
  return value.kind === "request";
}

function isRequestResponseEvent(value: RequestEvent): value is RequestResponseEvent {
  return value.kind === "response";
}

async function processNetworkData(
  replayClient: ReplayClientInterface,
  begin: TimeStampedPoint,
  end: TimeStampedPoint
): Promise<NetworkRequestEvent[]> {
  const { requestEventInfo, requestInfo } = await networkRequestsCache.readAsync(replayClient);

  const idToProcessedNetworkData: {
    [id: string]: {
      id: string;
      request: RequestOpenEvent | null;
      response: RequestResponseEvent | null;
      timestampedPoint: TimeStampedPoint;
    };
  } = {};

  const [beginIndex, endIndex] = findSliceIndices(
    requestInfo,
    begin.point,
    end.point,
    (item, point) => comparePoints(item.point, point)
  );

  if (beginIndex >= 0 && endIndex >= 0) {
    // Network events are for the entire recording (which may include more than one test)
    // we need to splice only the appropriate subset for each test.
    for (let index = beginIndex; index <= endIndex; index++) {
      const { id, point, time } = requestInfo[index];
      idToProcessedNetworkData[id] = {
        id,
        request: null,
        response: null,
        timestampedPoint: {
          point,
          time,
        },
      };
    }

    // Network responses may be processed after a test has finished,
    // so we should continue iterating past the end time.
    for (let index = beginIndex; index < requestEventInfo.length; index++) {
      const { event, id } = requestEventInfo[index];
      const processedNetworkData = idToProcessedNetworkData[id];
      if (processedNetworkData != null) {
        if (isRequestOpenEvent(event)) {
          processedNetworkData.request = event;
        } else if (isRequestResponseEvent(event)) {
          processedNetworkData.response = event;
        }
      }
    }
  }

  return Object.values(idToProcessedNetworkData).map(processedNetworkData => {
    assert(
      processedNetworkData.request !== null,
      `Missing request for network event ${processedNetworkData.id}`
    );

    return {
      data: {
        request: {
          method: processedNetworkData.request.requestMethod,
          url: processedNetworkData.request.requestUrl,
        },
        response: processedNetworkData.response
          ? {
              status: processedNetworkData.response.responseStatus,
            }
          : null,
      },
      timeStampedPoint: processedNetworkData.timestampedPoint,
      type: "network-request",
    };
  });
}
