import { ExecutionPoint, Message, PointRange, TimeStampedPoint } from "@replayio/protocol";

import { MockReplayClientInterface, createMockReplayClient } from "../utils/testing";
import type {
  MessageMetadata,
  streamingMessagesCache as StreamingMessagesCache,
} from "./MessagesCache";

describe("MessagesCache", () => {
  function createM(time: number): Message {
    return {
      source: "ConsoleAPI",
      level: "info",
      text: "Message",
      point: toTSP(time),
      pauseId: "fake-pause-id",
      data: {},
    };
  }

  async function getMessagesHelper(pointRange: PointRange): Promise<{
    messageMetadata: MessageMetadata;
    messages: Message[];
  }> {
    const stream = streamingMessagesCache.stream(mockClient, pointRange);

    await stream.resolver;

    return {
      messageMetadata: stream.data!,
      messages: stream.value!,
    };
  }

  function mockFindMessages(messages: Message[], overflow: boolean = false): void {
    mockClient.findMessages.mockImplementation(async onMessage => {
      if (onMessage) {
        messages.forEach(onMessage);
      }

      return {
        messages,
        overflow,
      };
    });
  }

  function mockFindMessagesInRange(messages: Message[], overflow: boolean = false): void {
    mockClient.findMessagesInRange.mockImplementation(() =>
      Promise.resolve({
        messages,
        overflow,
      })
    );
  }

  function toTSP(time: number): TimeStampedPoint {
    return { time, point: `${time}` };
  }

  function toPR(beginTime: number, endTime: number): PointRange {
    return { begin: `${beginTime}`, end: `${endTime}` };
  }

  let mockClient: MockReplayClientInterface;
  let streamingMessagesCache: typeof StreamingMessagesCache;
  let endpoint: ExecutionPoint = "1000";

  beforeEach(async () => {
    jest.resetModules();

    mockClient = createMockReplayClient();

    // Clear and recreate cached data between tests.
    const module = require("./MessagesCache");
    streamingMessagesCache = module.streamingMessagesCache;
  });

  it("should handle empty range", async () => {
    const data = await getMessagesHelper(toPR(1, 1));
    expect(data.messages).toEqual([]);
    expect(mockClient.findMessages).toHaveBeenCalledTimes(1);
    expect(mockClient.findMessagesInRange).not.toHaveBeenCalled();

    const newData = await getMessagesHelper(toPR(1, 1));
    expect(data.messages).toBe(newData.messages);
    expect(mockClient.findMessages).toHaveBeenCalledTimes(1);
    expect(mockClient.findMessagesInRange).not.toHaveBeenCalled();
  });

  it("should handle an empty array of messages", async () => {
    mockFindMessages([]);

    const data = await getMessagesHelper(toPR(0, 1));
    expect(data.messages).toEqual([]);
    expect(data.messageMetadata.didOverflow).toBe(false);
    expect(mockClient.findMessages).toHaveBeenCalledTimes(1);

    const newData = await getMessagesHelper(toPR(0, 1));
    expect(data.messages).toBe(newData.messages);
    expect(mockClient.findMessages).toHaveBeenCalledTimes(1);
  });

  it("should reuse cached messages for the same focus range", async () => {
    mockFindMessages([createM(0), createM(1), createM(2), createM(3)]);

    const data = await getMessagesHelper(toPR(1, 2));
    expect(data.messageMetadata.categoryCounts).toEqual({ errors: 0, logs: 2, warnings: 0 });
    expect(data.messageMetadata.countAfter).toBe(1);
    expect(data.messageMetadata.countBefore).toBe(1);
    expect(data.messages!.map(({ point }) => point.time)).toEqual([1, 2]);
    expect(data.messageMetadata.didOverflow).toBe(false);
    expect(mockClient.findMessages).toHaveBeenCalledTimes(1);

    const newData = await getMessagesHelper(toPR(1, 2));
    expect(data.messages).toBe(newData.messages);
    expect(mockClient.findMessages).toHaveBeenCalledTimes(1);
  });

  it("should report overflow", async () => {
    mockFindMessages([createM(1)], true);
    mockFindMessagesInRange([createM(1)], true);

    const data = await getMessagesHelper(toPR(0, 2));
    expect(data.messages!.map(({ point }) => point.time)).toEqual([1]);
    expect(data.messageMetadata.didOverflow).toBe(true);
    expect(mockClient.findMessages).toHaveBeenCalledTimes(1);
  });

  it("should filter within memory if non-overflowing focus range contracts", async () => {
    mockFindMessages([createM(0), createM(1), createM(2), createM(3)]);

    let data = await getMessagesHelper(toPR(0, +endpoint));
    expect(data.messages!.map(({ point }) => point.time)).toEqual([0, 1, 2, 3]);
    expect(data.messageMetadata.categoryCounts).toEqual({ errors: 0, logs: 4, warnings: 0 });
    expect(data.messageMetadata.didOverflow).toBe(false);
    expect(data.messageMetadata.countAfter).toBe(0);
    expect(data.messageMetadata.countBefore).toBe(0);
    expect(mockClient.findMessages).toHaveBeenCalledTimes(1);

    data = await getMessagesHelper(toPR(1, 2));
    expect(data.messageMetadata.categoryCounts).toEqual({ errors: 0, logs: 2, warnings: 0 });
    expect(data.messageMetadata.didOverflow).toBe(false);
    expect(data.messageMetadata.countAfter).toBe(1);
    expect(data.messageMetadata.countBefore).toBe(1);
    expect(data.messages!.map(({ point }) => point.time)).toEqual([1, 2]);
    expect(mockClient.findMessages).toHaveBeenCalledTimes(1);
  });

  it("should filter within memory if non-overflowing focus range expands", async () => {
    mockFindMessages([createM(0), createM(1), createM(2), createM(3)]);

    let data = await getMessagesHelper(toPR(1, 2));
    expect(data.messages!.map(({ point }) => point.time)).toEqual([1, 2]);
    expect(data.messageMetadata.didOverflow).toBe(false);
    expect(mockClient.findMessages).toHaveBeenCalledTimes(1);

    data = await getMessagesHelper(toPR(0, 3));
    expect(data.messages!.map(({ point }) => point.time)).toEqual([0, 1, 2, 3]);
    expect(data.messageMetadata.didOverflow).toBe(false);
    expect(mockClient.findMessages).toHaveBeenCalledTimes(1);
  });

  it("should re-request if overflowing focus range contracts", async () => {
    mockFindMessages([createM(0), createM(1)], true);
    mockFindMessagesInRange([createM(0), createM(1), createM(2)], true);

    let data = await getMessagesHelper(toPR(0, +endpoint));
    expect(data.messages!.map(({ point }) => point.time)).toEqual([0, 1, 2]);
    expect(data.messageMetadata.categoryCounts).toEqual({ errors: 0, logs: 3, warnings: 0 });
    expect(data.messageMetadata.didOverflow).toBe(true);
    expect(mockClient.findMessages).toHaveBeenCalledTimes(1);
    expect(mockClient.findMessagesInRange).toHaveBeenCalledTimes(1);

    mockFindMessagesInRange([createM(1), createM(2)], false);

    data = await getMessagesHelper(toPR(1, 2));
    expect(data.messageMetadata.categoryCounts).toEqual({ errors: 0, logs: 2, warnings: 0 });

    expect(data.messageMetadata.didOverflow).toBe(false);
    expect(data.messages!.map(({ point }) => point.time)).toEqual([1, 2]);
    expect(mockClient.findMessages).toHaveBeenCalledTimes(1);
    expect(mockClient.findMessagesInRange).toHaveBeenCalledTimes(2);
  });

  it("should re-request if overflowing focus range expands", async () => {
    mockFindMessages([createM(0), createM(1)], true);
    mockFindMessagesInRange([createM(1), createM(2)], true);

    let data = await getMessagesHelper(toPR(1, 2));
    expect(data.messages!.map(({ point }) => point.time)).toEqual([1, 2]);

    expect(data.messageMetadata.didOverflow).toBe(true);
    expect(mockClient.findMessages).toHaveBeenCalledTimes(1);

    mockFindMessagesInRange([createM(0), createM(1), createM(2)], true);
    data = await getMessagesHelper(toPR(0, 3));
    expect(data.messages!.map(({ point }) => point.time)).toEqual([0, 1, 2]);

    expect(data.messageMetadata.didOverflow).toBe(true);
    expect(mockClient.findMessages).toHaveBeenCalledTimes(1);
  });

  it("should catch errors and report them in the response data", async () => {
    mockClient.findMessages.mockImplementation(() => {
      throw new Error("Expected");
    });

    console.error = jest.fn();

    await expect(async () => await getMessagesHelper(toPR(0, 1))).rejects.toThrow("Expected");
  });
});
