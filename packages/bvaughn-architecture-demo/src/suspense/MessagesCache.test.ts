import { Message, TimeStampedPoint, TimeStampedPointRange } from "@replayio/protocol";

import { ReplayClientInterface } from "shared/client/types";

import { createMockReplayClient } from "../utils/testing";
import { MessageData } from "./MessagesCache";

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

  async function getMessagesHelper(range: TimeStampedPointRange | null): Promise<MessageData> {
    try {
      return getMessagesSuspense(client as any as ReplayClientInterface, range);
    } catch (promise) {
      await promise;

      return getMessagesSuspense(client as any as ReplayClientInterface, range);
    }
  }

  function mockHelper(messages: Message[], overflow: boolean = false): void {
    client.findMessages.mockImplementation(() =>
      Promise.resolve({
        messages,
        overflow,
      })
    );
  }

  function toTSP(time: number): TimeStampedPoint {
    return { time, point: `${time * 1000}` };
  }

  function toTSPR(beginTime: number, endTime: number): TimeStampedPointRange {
    return { begin: toTSP(beginTime), end: toTSP(endTime) };
  }

  let client: { [key: string]: jest.Mock };
  let getMessagesSuspense: (
    client: ReplayClientInterface,
    range: TimeStampedPointRange | null
  ) => Promise<MessageData>;

  beforeEach(() => {
    client = createMockReplayClient() as any;

    // Clear and recreate cached data between tests.
    const module = require("./MessagesCache");
    getMessagesSuspense = module.getMessagesSuspense;
  });

  afterEach(() => {
    jest.resetModules();
  });

  it("should handle empty range", async () => {
    const data = await getMessagesHelper(toTSPR(1, 1));
    expect(data.messages).toEqual([]);
    expect(client.findMessages).not.toHaveBeenCalled();

    const newData = await getMessagesHelper(toTSPR(1, 1));
    expect(data.messages).toBe(newData.messages);
    expect(client.findMessages).not.toHaveBeenCalled();
  });

  it("should handle an empty array of messages", async () => {
    mockHelper([]);

    const data = await getMessagesHelper(toTSPR(0, 1));
    expect(data.messages).toEqual([]);
    expect(data.didOverflow).toBe(false);
    expect(client.findMessages).toHaveBeenCalledTimes(1);

    const newData = await getMessagesHelper(toTSPR(0, 1));
    expect(data.messages).toBe(newData.messages);
    expect(client.findMessages).toHaveBeenCalledTimes(1);
  });

  it("should reuse cached messages when there is no focus range", async () => {
    mockHelper([createM(0), createM(1), createM(2)]);

    const data = await getMessagesHelper(null);
    expect(data.categoryCounts).toEqual({ errors: 0, logs: 3, warnings: 0 });
    expect(data.countAfter).toBe(0);
    expect(data.countBefore).toBe(0);
    expect(data.messages.map(({ point }) => point.time)).toEqual([0, 1, 2]);
    expect(data.didOverflow).toBe(false);
    expect(client.findMessages).toHaveBeenCalledTimes(1);

    const newData = await getMessagesHelper(null);
    expect(data.messages).toBe(newData.messages);
    expect(client.findMessages).toHaveBeenCalledTimes(1);
  });

  it("should reuse cached messages for the same focus range", async () => {
    mockHelper([createM(0), createM(1), createM(2), createM(3)]);

    const data = await getMessagesHelper(toTSPR(1, 2));
    expect(data.categoryCounts).toEqual({ errors: 0, logs: 2, warnings: 0 });
    expect(data.countAfter).toBe(-1);
    expect(data.countBefore).toBe(-1);
    expect(data.messages.map(({ point }) => point.time)).toEqual([1, 2]);
    expect(data.didOverflow).toBe(false);
    expect(client.findMessages).toHaveBeenCalledTimes(1);

    const newData = await getMessagesHelper(toTSPR(1, 2));
    expect(data.messages).toBe(newData.messages);
    expect(client.findMessages).toHaveBeenCalledTimes(1);
  });

  it("should report overflow", async () => {
    mockHelper([createM(1)], true);

    const data = await getMessagesHelper(null);
    expect(data.messages.map(({ point }) => point.time)).toEqual([1]);
    expect(data.didOverflow).toBe(true);
    expect(client.findMessages).toHaveBeenCalledTimes(1);
  });

  it("should filter within memory if focus range contracts from previously null", async () => {
    mockHelper([createM(0), createM(1), createM(2), createM(3)]);

    let data = await getMessagesHelper(null);
    expect(data.messages.map(({ point }) => point.time)).toEqual([0, 1, 2, 3]);
    expect(data.categoryCounts).toEqual({ errors: 0, logs: 4, warnings: 0 });
    expect(data.countAfter).toBe(0);
    expect(data.countBefore).toBe(0);
    expect(client.findMessages).toHaveBeenCalledTimes(1);

    data = await getMessagesHelper(toTSPR(1, 2));
    expect(data.categoryCounts).toEqual({ errors: 0, logs: 2, warnings: 0 });
    expect(data.countAfter).toBe(1);
    expect(data.countBefore).toBe(1);
    expect(data.messages.map(({ point }) => point.time)).toEqual([1, 2]);
    expect(client.findMessages).toHaveBeenCalledTimes(1);
  });

  it("should filter within memory if focus range contracts from previously focused", async () => {
    mockHelper([createM(0), createM(1), createM(2), createM(3)]);

    let data = await getMessagesHelper(toTSPR(0, 3));
    expect(data.messages.map(({ point }) => point.time)).toEqual([0, 1, 2, 3]);
    expect(data.categoryCounts).toEqual({ errors: 0, logs: 4, warnings: 0 });
    expect(data.countAfter).toBe(-1);
    expect(data.countBefore).toBe(-1);
    expect(client.findMessages).toHaveBeenCalledTimes(1);

    data = await getMessagesHelper(toTSPR(1, 2));
    expect(data.messages.map(({ point }) => point.time)).toEqual([1, 2]);
    expect(data.categoryCounts).toEqual({ errors: 0, logs: 2, warnings: 0 });
    expect(data.countAfter).toBe(-1);
    expect(data.countBefore).toBe(-1);
    expect(client.findMessages).toHaveBeenCalledTimes(1);
  });

  it("should re-request if focus range expands", async () => {
    mockHelper([createM(1), createM(2)]);

    let data = await getMessagesHelper(toTSPR(1, 2));
    expect(data.messages.map(({ point }) => point.time)).toEqual([1, 2]);
    expect(client.findMessages).toHaveBeenCalledTimes(1);

    mockHelper([createM(0), createM(1), createM(2), createM(3)]);

    data = await getMessagesHelper(toTSPR(0, 3));
    expect(data.messages.map(({ point }) => point.time)).toEqual([0, 1, 2, 3]);
    expect(client.findMessages).toHaveBeenCalledTimes(2);
  });

  it("should re-request if focus range expands to null", async () => {
    mockHelper([createM(1), createM(2)]);

    let data = await getMessagesHelper(toTSPR(1, 2));
    expect(data.messages.map(({ point }) => point.time)).toEqual([1, 2]);
    expect(client.findMessages).toHaveBeenCalledTimes(1);

    mockHelper([createM(0), createM(1), createM(2), createM(3)]);

    data = await getMessagesHelper(null);
    expect(data.messages.map(({ point }) => point.time)).toEqual([0, 1, 2, 3]);
    expect(client.findMessages).toHaveBeenCalledTimes(2);
  });

  it("should always re-request if focus region changes after overflow", async () => {
    mockHelper([createM(1)], true);

    let data = await getMessagesHelper(toTSPR(0, 3));
    expect(data.messages.map(({ point }) => point.time)).toEqual([1]);
    expect(data.didOverflow).toBe(true);
    expect(client.findMessages).toHaveBeenCalledTimes(1);

    data = await getMessagesHelper(toTSPR(1, 3));
    expect(data.messages.map(({ point }) => point.time)).toEqual([1]);
    expect(data.didOverflow).toBe(true);
    expect(client.findMessages).toHaveBeenCalledTimes(2);

    data = await getMessagesHelper(toTSPR(1, 2));
    expect(data.messages.map(({ point }) => point.time)).toEqual([1]);
    expect(data.didOverflow).toBe(true);
    expect(client.findMessages).toHaveBeenCalledTimes(3);
  });

  it("should ignore a protocol response if a newer request is in-flight", async () => {
    let resolvePromise1: any;
    let resolvePromise2: any;

    const promise1 = new Promise(resolve => {
      resolvePromise1 = () =>
        resolve({
          messages: [createM(0), createM(1)],
          overflow: false,
        });
    });
    const promise2 = new Promise(resolve => {
      resolvePromise2 = () =>
        resolve({
          messages: [createM(2), createM(3)],
          overflow: false,
        });
    });

    client.findMessages.mockImplementation(() => promise1);
    try {
      getMessagesSuspense(client as any as ReplayClientInterface, toTSPR(0, 1));
    } catch (promise) {}
    expect(client.findMessages).toHaveBeenCalledTimes(1);

    client.findMessages.mockImplementation(() => promise2);
    try {
      getMessagesSuspense(client as any as ReplayClientInterface, toTSPR(2, 3));
    } catch (promise) {}
    expect(client.findMessages).toHaveBeenCalledTimes(2);

    resolvePromise2();
    await promise2;

    resolvePromise1();
    await promise1;

    const data = await getMessagesHelper(toTSPR(2, 3));
    expect(data.messages.map(({ point }) => point.time)).toEqual([2, 3]);
    expect(client.findMessages).toHaveBeenCalledTimes(2);
  });

  it("should re-use the in-flight promise if the same focus range is specified", async () => {
    const promise = new Promise(() => {});

    client.findMessages.mockImplementation(() => promise);

    getMessagesHelper(toTSPR(0, 1));
    getMessagesHelper(toTSPR(0, 1));
    getMessagesHelper(toTSPR(0, 1));

    expect(client.findMessages).toHaveBeenCalledTimes(1);

    getMessagesHelper(null);
    getMessagesHelper(null);

    expect(client.findMessages).toHaveBeenCalledTimes(2);
  });

  it("should not continue to re-request the same messages after a failure", async () => {
    client.findMessages.mockImplementation(() => {
      throw new Error("Expected");
    });

    console.error = jest.fn();

    try {
      await getMessagesHelper(toTSPR(0, 1));
    } catch (error) {}
    expect(client.findMessages).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();

    try {
      await getMessagesHelper(toTSPR(0, 1));
    } catch (error) {}
    expect(client.findMessages).toHaveBeenCalledTimes(1);
  });

  it("should re-request messages after a failure if parameters change", async () => {
    client.findMessages.mockImplementation(() => {
      throw new Error("Expected");
    });

    console.error = jest.fn();

    try {
      await getMessagesHelper(toTSPR(0, 1));
    } catch (error) {}
    expect(client.findMessages).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();

    try {
      await getMessagesHelper(toTSPR(0, 2));
    } catch (error) {}
    expect(client.findMessages).toHaveBeenCalledTimes(2);
  });
});
