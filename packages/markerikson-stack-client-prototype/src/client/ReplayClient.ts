import {
  ExecutionPoint,
  Message,
  SessionId,
  TimeStampedPoint,
  TimeStampedPointRange,
} from "@replayio/protocol";
// eslint-disable-next-line no-restricted-imports
import { client, initSocket } from "protocol/socket";
import { compareNumericStrings } from "protocol/utils";
import { UserInfo } from "../graphql/types";
import { getCurrentUserInfo } from "../graphql/User";

// TODO How should the client handle concurrent requests?
// Should we force serialization?
// Should we cancel in-flight requests and start new ones?

export interface ReplayClientInterface {
  initialize(recordingId: string, accessToken: string | null): Promise<SessionId>;
  findMessages(focusRange: TimeStampedPointRange | null): Promise<{
    messages: Message[];
    overflow: boolean;
  }>;
  getPointNearTime(time: number): Promise<TimeStampedPoint>;
  getSessionEndpoint(sessionId: SessionId): Promise<TimeStampedPoint>;
}

export class ReplayClient implements ReplayClient {
  private _sessionId: SessionId | null = null;
  // private _threadFront: typeof ThreadFront;

  constructor(dispatchURL: string) {
    // this._threadFront = threadFront;

    if (typeof window !== "undefined") {
      initSocket(dispatchURL);
    }
  }

  public getSessionIdThrows(): SessionId {
    const sessionId = this._sessionId;
    if (sessionId === null) {
      throw Error("Invalid session");
    }
    return sessionId;
  }

  async initialize(recordingId: string, accessToken: string | null): Promise<SessionId> {
    if (accessToken != null) {
      await client.Authentication.setAccessToken({ accessToken });
    }

    const { sessionId } = await client.Recording.createSession({ recordingId });

    this._sessionId = sessionId;
    //8this._threadFront.setSessionId(sessionId);

    return sessionId;
  }

  async findMessages(focusRange: TimeStampedPointRange | null): Promise<{
    messages: Message[];
    overflow: boolean;
  }> {
    const sessionId = this.getSessionIdThrows();

    if (focusRange !== null) {
      const response = await client.Console.findMessagesInRange(
        { range: { begin: focusRange.begin.point, end: focusRange.end.point } },
        sessionId
      );

      // Messages aren't guaranteed to arrive sorted, but unsorted messages aren't that useful to work with.
      // So sort them before returning.
      const sortedMessages = response.messages.sort((messageA: Message, messageB: Message) => {
        const pointA = messageA.point.point;
        const pointB = messageB.point.point;
        return compareNumericStrings(pointA, pointB);
      });

      return {
        messages: sortedMessages,
        overflow: response.overflow == true,
      };
    } else {
      const sortedMessages: Message[] = [];

      // TOOD This won't work if there are every overlapping requests.
      // Do we need to implement some kind of locking mechanism to ensure only one read is going at a time?
      client.Console.addNewMessageListener(({ message }) => {
        const newMessagePoint = message.point.point;

        // Messages may arrive out of order so let's sort them as we get them.
        let lowIndex = 0;
        let highIndex = sortedMessages.length;
        while (lowIndex < highIndex) {
          let middleIndex = (lowIndex + highIndex) >>> 1;
          const message = sortedMessages[middleIndex];

          if (compareNumericStrings(message.point.point, newMessagePoint)) {
            lowIndex = middleIndex + 1;
          } else {
            highIndex = middleIndex;
          }
        }

        const insertAtIndex = lowIndex;

        sortedMessages.splice(insertAtIndex, 0, message);
      });

      const response = await client.Console.findMessages({}, sessionId);

      client.Console.removeNewMessageListener();

      return {
        messages: sortedMessages,
        overflow: response.overflow == true,
      };
    }
  }

  /*
  async findSources(): Promise<void> {
    await this._threadFront.findSources(() => {
      // The demo doesn't use these directly, but the client throws if they aren't loaded.
    });
  }
*/
  async getPointNearTime(time: number): Promise<TimeStampedPoint> {
    const sessionId = this.getSessionIdThrows();
    const { point } = await client.Session.getPointNearTime({ time: time }, sessionId);

    return point;
  }

  async getSessionEndpoint(sessionId: SessionId): Promise<TimeStampedPoint> {
    const { endpoint } = await client.Session.getEndpoint({}, sessionId);

    return endpoint;
  }
}

// By default, this context wires the app up to use real Replay backend APIs.
// We can leverage this when writing tests (or UI demos) by injecting a stub client.
let DISPATCH_URL = "wss://dispatch.replay.io";
if (typeof window !== "undefined") {
  const url = new URL(window.location.href);
  if (url.searchParams.has("dispatch")) {
    DISPATCH_URL = url.searchParams.get("dispatch") as string;
  }
}

export const replayClient = new ReplayClient(DISPATCH_URL);

export const asyncInitializeClient = async () => {
  // Read some of the hard-coded values from query params.
  // (This is just a prototype; no sense building a full authentication flow.)
  const url = new URL(window.location.href);
  const accessToken = url.searchParams.get("accessToken");
  const recordingId = url.searchParams.get("recordingId");
  console.log({ accessToken, recordingId });
  if (!recordingId) {
    throw Error(`Must specify "recordingId" parameter.`);
  }

  const sessionId = await replayClient.initialize(recordingId, accessToken);
  const endpoint = await replayClient.getSessionEndpoint(sessionId);
  console.log("Loaded session: ", sessionId);

  // The demo doesn't use these directly, but the client throws if they aren't loaded.
  // await replayClient.findSources();

  let currentUserInfo: UserInfo | null = null;
  if (accessToken) {
    currentUserInfo = await getCurrentUserInfo(accessToken);
  }

  return {
    accessToken: accessToken || null,
    currentUserInfo,
    duration: endpoint.time,
    endPoint: endpoint.point,
    recordingId,
    sessionId,
  };
};
