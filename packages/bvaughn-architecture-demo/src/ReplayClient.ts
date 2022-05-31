import { ExecutionPoint, Message, SessionId, TimeStampedPointRange } from "@replayio/protocol";
import { client } from "protocol/socket";
import type { ThreadFront } from "protocol/thread";

import { isRangeSubset } from "./utils/time";

// TODO How should the client handle concurrent requests?
// Should we force serialization?
// Should we cancel in-flight requests and start new ones?

export default class ReplayClient {
  private _focusRange: TimeStampedPointRange | null = null;
  private _messageClient: MessageClient;

  // TODO Pass config of some sort?
  constructor(threadFront: typeof ThreadFront) {
    this._messageClient = new MessageClient(threadFront);
  }

  get focusRange(): TimeStampedPointRange | null {
    return this._focusRange;
  }

  get messages(): Message[] {
    return this._messageClient.filteredMessages;
  }

  // Narrow focus window for all Replay data.
  async setFocus(focusRange: TimeStampedPointRange | null): Promise<void> {
    this._focusRange = focusRange;

    // Update all data; fetch from the backend or filter in memory, as needed.
    await Promise.all([this._messageClient.setFocus(focusRange)]);
  }
}

class MessageClient {
  private _filteredMessages: Message[] = [];
  private _lastFetchDidOverflow: boolean = false;
  private _lastFetchFocusRange: TimeStampedPointRange | null = null;
  private _numFilteredAfterFocusRange: number = 0;
  private _numFilteredBeforeFocusRange: number = 0;
  private _unfilteredMessages: Message[] = [];
  private _sessionEndpoint: ExecutionPoint | null = null;
  private _threadFront: typeof ThreadFront;

  constructor(threadFront: typeof ThreadFront) {
    this._threadFront = threadFront;
  }

  get didOverflow(): boolean {
    return this._lastFetchDidOverflow;
  }

  get filteredMessages(): Message[] {
    return this._filteredMessages;
  }

  get numFilteredAfterFocusRange(): number {
    return this._numFilteredAfterFocusRange;
  }

  get numFilteredBeforeFocusRange(): number {
    return this._numFilteredBeforeFocusRange;
  }

  // Apply the new focus window to console logs.
  //
  // In many cases, this will be a synchronous in-memory operation.
  // In some cases, this will require re-fetching from the backend.
  async setFocus(focusRange: TimeStampedPointRange | null): Promise<void> {
    if (
      this._unfilteredMessages === null ||
      this._lastFetchDidOverflow ||
      !isRangeSubset(this._lastFetchFocusRange, focusRange)
    ) {
      const sessionId = this._threadFront.sessionId as SessionId;

      if (!this._sessionEndpoint) {
        this._sessionEndpoint = (await client.Session.getEndpoint({}, sessionId)).endpoint.point;
      }

      const begin = focusRange ? focusRange.begin.point : "0";
      const end = focusRange ? focusRange.end.point : this._sessionEndpoint!;
      const { messages, overflow } = await client.Console.findMessagesInRange(
        { range: { begin, end } },
        sessionId
      );

      this._lastFetchDidOverflow = overflow === true;
      this._unfilteredMessages = messages;
    }

    // Filter in-memory values.
    if (focusRange === null) {
      this._filteredMessages = this._unfilteredMessages;
    } else {
      const begin = focusRange.begin.time;
      const end = focusRange.end.time;

      this._numFilteredAfterFocusRange = 0;
      this._numFilteredBeforeFocusRange = 0;
      this._filteredMessages = this._unfilteredMessages.filter(message => {
        const time = message.point.time;
        if (time < begin) {
          this._numFilteredBeforeFocusRange++;
          return false;
        } else if (time > end) {
          this._numFilteredAfterFocusRange++;
          return false;
        } else {
          return true;
        }
      });
    }
  }
}
