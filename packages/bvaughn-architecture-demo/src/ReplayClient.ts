import {
  ExecutionPoint,
  Message,
  SessionId,
  TimeStampedPoint,
  TimeStampedPointRange,
} from "@replayio/protocol";
import { client, initSocket } from "protocol/socket";
import type { ThreadFront } from "protocol/thread";

// TODO How should the client handle concurrent requests?
// Should we force serialization?
// Should we cancel in-flight requests and start new ones?

export interface ReplayClientInterface {
  initialize(recordingId: string, accessToken: string | null): Promise<SessionId>;
  findMessages(focusRange: TimeStampedPointRange | null): Promise<{
    messages: Message[];
    overflow: boolean;
  }>;
  findSources(): Promise<void>;
  getPointNearTime(time: number): Promise<TimeStampedPoint>;
  getSessionEndpoint(sessionId: SessionId): Promise<TimeStampedPoint>;
}

export class ReplayClient implements ReplayClient {
  private _sessionId: SessionId | null = null;
  private _threadFront: typeof ThreadFront;

  constructor(dispatchURL: string, threadFront: typeof ThreadFront) {
    this._threadFront = threadFront;

    if (typeof window !== "undefined") {
      initSocket(dispatchURL);
    }
  }

  private getSessionIdThrows(): SessionId {
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
    this._threadFront.setSessionId(sessionId);

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

      return {
        messages: response.messages,
        overflow: response.overflow == true,
      };
    } else {
      const messages: Message[] = [];

      // TOOD This won't work if there are every overlapping requests.
      client.Console.addNewMessageListener(({ message }) => {
        messages.push(message);
      });

      const response = await client.Console.findMessages({}, sessionId);

      client.Console.removeNewMessageListener();

      return {
        messages,
        overflow: response.overflow == true,
      };
    }
  }

  async findSources(): Promise<void> {
    await this._threadFront.findSources(() => {
      // The demo doesn't use these directly, but the client throws if they aren't loaded.
    });
  }

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
