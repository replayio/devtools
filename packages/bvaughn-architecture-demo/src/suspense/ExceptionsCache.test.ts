import { TimeStampedPoint, TimeStampedPointRange } from "@replayio/protocol";
import { ReplayClientInterface } from "shared/client/types";

import { createMockReplayClient } from "../utils/testing";

import { Status, UncaughtException } from "./ExceptionsCache";

describe("ExceptionsCache", () => {
  function createCE() {
    const error = new Error("There are too many points to complete this operation");
    error.name = "CommandError";
    return error;
  }

  function createUE(time: number = 0) {
    return {
      data: { frames: [], objects: [], scopes: [] },
      location: [],
      pauseId: "pause",
      point: `${time * 1000}`,
      time,
      values: [],
      type: "UncaughtException",
    };
  }

  async function getExceptionsHelper(
    range: TimeStampedPointRange | null
  ): Promise<UncaughtException[]> {
    try {
      return getExceptions(client as any as ReplayClientInterface, range);
    } catch (promise) {
      await promise;

      return getExceptions(client as any as ReplayClientInterface, range);
    }
  }

  function toTSP(time: number): TimeStampedPoint {
    return { time, point: `${time * 1000}` };
  }

  function toTSPR(beginTime: number, endTime: number): TimeStampedPointRange {
    return { begin: toTSP(beginTime), end: toTSP(endTime) };
  }

  let client: { [key: string]: jest.Mock };
  let getExceptions: (
    client: ReplayClientInterface,
    range: TimeStampedPointRange | null
  ) => Promise<UncaughtException[]>;
  let getStatus: () => Status;
  let subscribeForStatus: (callback: () => {}) => () => {};

  beforeEach(() => {
    client = createMockReplayClient() as any;

    // Clear and recreate cached data between tests.
    const module = require("./ExceptionsCache");
    getExceptions = module.getExceptions;
    getStatus = module.getStatus;
    subscribeForStatus = module.subscribeForStatus;
  });

  afterEach(() => {
    jest.resetModules();
  });

  it("should handle empty range", async () => {
    expect(getStatus()).toBe("uninitialized");

    const exceptions = await getExceptionsHelper(toTSPR(1, 1));

    expect(exceptions).toEqual([]);
    expect(exceptions).toBe(await getExceptionsHelper(toTSPR(1, 1)));

    expect(client.runAnalysis).not.toHaveBeenCalled();

    expect(getStatus()).toBe("fetched");
  });

  it("should handle an empty array of exceptions", async () => {
    client.runAnalysis.mockImplementation(() => Promise.resolve([]));

    const exceptions = await getExceptionsHelper(toTSPR(1, 2));
    expect(exceptions).toEqual([]);
    expect(exceptions).toBe(await getExceptionsHelper(toTSPR(1, 2)));

    expect(client.runAnalysis).toHaveBeenCalledTimes(1);

    expect(getStatus()).toBe("fetched");
  });

  it("should reuse cached exceptions when there is no focus range", async () => {
    client.runAnalysis.mockImplementation(() =>
      Promise.resolve([createUE(0), createUE(1), createUE(2), createUE(3)])
    );

    const exceptions = await getExceptionsHelper(null);
    expect(exceptions.map(({ time }) => time)).toEqual([0, 1, 2, 3]);
    expect(exceptions).toBe(await getExceptionsHelper(null));

    expect(client.runAnalysis).toHaveBeenCalledTimes(1);

    expect(getStatus()).toBe("fetched");
  });

  it("should reuse cached exceptions for the same focus range", async () => {
    client.runAnalysis.mockImplementation(() =>
      Promise.resolve([createUE(0), createUE(1), createUE(2), createUE(3)])
    );

    const exceptions = await getExceptionsHelper(toTSPR(1, 2));
    expect(exceptions.map(({ time }) => time)).toEqual([1, 2]);
    expect(exceptions).toBe(await getExceptionsHelper(toTSPR(1, 2)));

    expect(client.runAnalysis).toHaveBeenCalledTimes(1);
  });

  it("should handle a too many exception points", async () => {
    client.runAnalysis.mockImplementation(() => Promise.reject(createCE()));

    const exceptions = await getExceptionsHelper(toTSPR(1, 2));
    expect(exceptions).toEqual([]);
    expect(exceptions).toBe(await getExceptionsHelper(toTSPR(1, 2)));

    expect(client.runAnalysis).toHaveBeenCalledTimes(1);

    expect(getStatus()).toBe("failed-too-many-points");
  });

  it("should filter within memory if focus range contracts from previously null", async () => {
    client.runAnalysis.mockImplementation(() =>
      Promise.resolve([createUE(0), createUE(1), createUE(2), createUE(3)])
    );

    let exceptions = await getExceptionsHelper(null);
    expect(exceptions.map(({ time }) => time)).toEqual([0, 1, 2, 3]);
    expect(client.runAnalysis).toHaveBeenCalledTimes(1);

    exceptions = await getExceptionsHelper(toTSPR(1, 2));
    expect(exceptions.map(({ time }) => time)).toEqual([1, 2]);
    expect(client.runAnalysis).toHaveBeenCalledTimes(1);
  });

  it("should filter within memory if focus range contracts from previously focused", async () => {
    client.runAnalysis.mockImplementation(() =>
      Promise.resolve([createUE(0), createUE(1), createUE(2), createUE(3)])
    );

    let exceptions = await getExceptionsHelper(toTSPR(0, 3));
    expect(exceptions.map(({ time }) => time)).toEqual([0, 1, 2, 3]);
    expect(client.runAnalysis).toHaveBeenCalledTimes(1);

    exceptions = await getExceptionsHelper(toTSPR(1, 3));
    expect(exceptions.map(({ time }) => time)).toEqual([1, 2, 3]);
    expect(client.runAnalysis).toHaveBeenCalledTimes(1);

    exceptions = await getExceptionsHelper(toTSPR(2, 3));
    expect(exceptions.map(({ time }) => time)).toEqual([2, 3]);
    expect(client.runAnalysis).toHaveBeenCalledTimes(1);
  });

  it("should re-request if focus range expands", async () => {
    client.runAnalysis.mockImplementation(() => Promise.resolve([createUE(1), createUE(2)]));

    let exceptions = await getExceptionsHelper(toTSPR(1, 2));
    expect(exceptions.map(({ time }) => time)).toEqual([1, 2]);
    expect(client.runAnalysis).toHaveBeenCalledTimes(1);

    client.runAnalysis.mockImplementation(() =>
      Promise.resolve([createUE(1), createUE(2), createUE(3)])
    );
    exceptions = await getExceptionsHelper(toTSPR(1, 3));
    expect(exceptions.map(({ time }) => time)).toEqual([1, 2, 3]);
    expect(client.runAnalysis).toHaveBeenCalledTimes(2);

    client.runAnalysis.mockImplementation(() =>
      Promise.resolve([createUE(0), createUE(1), createUE(2), createUE(3)])
    );
    exceptions = await getExceptionsHelper(toTSPR(0, 3));
    expect(exceptions.map(({ time }) => time)).toEqual([0, 1, 2, 3]);
    expect(client.runAnalysis).toHaveBeenCalledTimes(3);
  });

  it("should re-request if focus range expands to null", async () => {
    client.runAnalysis.mockImplementation(() => Promise.resolve([createUE(1), createUE(2)]));

    let exceptions = await getExceptionsHelper(toTSPR(1, 2));
    expect(exceptions.map(({ time }) => time)).toEqual([1, 2]);
    expect(client.runAnalysis).toHaveBeenCalledTimes(1);

    client.runAnalysis.mockImplementation(() =>
      Promise.resolve([createUE(0), createUE(1), createUE(2), createUE(3)])
    );
    exceptions = await getExceptionsHelper(null);
    expect(exceptions.map(({ time }) => time)).toEqual([0, 1, 2, 3]);
    expect(client.runAnalysis).toHaveBeenCalledTimes(2);
  });

  it("should always re-request if focus region changes after too many points error", async () => {
    client.runAnalysis.mockImplementation(() => Promise.reject(createCE()));

    let exceptions = await getExceptionsHelper(toTSPR(0, 3));
    expect(exceptions).toEqual([]);
    expect(getStatus()).toBe("failed-too-many-points");
    expect(client.runAnalysis).toHaveBeenCalledTimes(1);

    exceptions = await getExceptionsHelper(toTSPR(1, 3));
    expect(exceptions).toEqual([]);
    expect(getStatus()).toBe("failed-too-many-points");
    expect(client.runAnalysis).toHaveBeenCalledTimes(2);

    exceptions = await getExceptionsHelper(toTSPR(1, 2));
    expect(exceptions).toEqual([]);
    expect(getStatus()).toBe("failed-too-many-points");
    expect(client.runAnalysis).toHaveBeenCalledTimes(3);
  });

  it("should ignore a protocol response if a newer request is in-flight", async () => {
    let resolvePromise1: any;
    let resolvePromise2: any;

    const promise1 = new Promise(resolve => {
      resolvePromise1 = () => resolve([createUE(0), createUE(1)]);
    });
    const promise2 = new Promise(resolve => {
      resolvePromise2 = () => resolve([createUE(2), createUE(3)]);
    });

    client.runAnalysis.mockImplementation(() => promise1);
    try {
      getExceptions(client as any as ReplayClientInterface, toTSPR(0, 1));
    } catch (promise) {}

    client.runAnalysis.mockImplementation(() => promise2);
    try {
      getExceptions(client as any as ReplayClientInterface, toTSPR(2, 3));
    } catch (promise) {}

    resolvePromise2();
    await promise2;

    resolvePromise1();
    await promise1;

    const exceptions = await getExceptionsHelper(toTSPR(2, 3));
    expect(exceptions.map(({ time }) => time)).toEqual([2, 3]);
    expect(client.runAnalysis).toHaveBeenCalledTimes(2);
  });

  it("should re-use the in-flight promise if the same focus range is specified", async () => {
    const promise = new Promise(() => {});

    client.runAnalysis.mockImplementation(() => promise);
    getExceptionsHelper(toTSPR(0, 1));

    expect(getStatus()).toBe("request-in-progress");

    getExceptionsHelper(toTSPR(0, 1));
    getExceptionsHelper(toTSPR(0, 1));

    expect(client.runAnalysis).toHaveBeenCalledTimes(1);

    getExceptionsHelper(null);
    getExceptionsHelper(null);

    expect(client.runAnalysis).toHaveBeenCalledTimes(2);
  });

  describe("subscribeForStatus", () => {
    let statuses: Status[] = [];

    beforeEach(() => {
      statuses = [];

      const callback = jest.fn(async () => {
        statuses.push(getStatus());
      });

      subscribeForStatus(callback);
    });

    it("should notify after empty range", async () => {
      await getExceptionsHelper(toTSPR(1, 1));

      expect(statuses).toEqual(["fetched"]);
    });

    it("should notify after too many points error", async () => {
      client.runAnalysis.mockImplementation(() => Promise.reject(createCE()));

      await getExceptionsHelper(toTSPR(0, 1));

      expect(statuses).toEqual(["request-in-progress", "failed-too-many-points"]);
    });

    it("should notify after success", async () => {
      client.runAnalysis.mockImplementation(() => Promise.resolve([createUE(1)]));

      await getExceptionsHelper(toTSPR(0, 1));

      expect(statuses).toEqual(["request-in-progress", "fetched"]);
    });

    it("should unsubscribe", async () => {
      const callback = jest.fn(() => {
        throw Error("Unexpected call");
      });

      const unsubscribe = subscribeForStatus(callback);
      unsubscribe();

      getExceptionsHelper(toTSPR(0, 1));

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
