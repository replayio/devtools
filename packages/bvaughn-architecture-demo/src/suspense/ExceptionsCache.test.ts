import { TimeStampedPoint, TimeStampedPointRange } from "@replayio/protocol";
import { ReplayClientInterface } from "shared/client/types";

import { createMockReplayClient } from "../utils/testing";

import { UncaughtException } from "./ExceptionsCache";

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

  function toTSP(time: number): TimeStampedPoint {
    return { time, point: `${time * 1000}` };
  }

  function toTSPR(beginTime: number, endTime: number): TimeStampedPointRange {
    return { begin: toTSP(beginTime), end: toTSP(endTime) };
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

  let client: { [key: string]: jest.Mock };
  let didExceptionsFailTooManyPoints: () => boolean;
  let getExceptions: (
    client: ReplayClientInterface,
    range: TimeStampedPointRange | null
  ) => Promise<UncaughtException[]>;

  beforeEach(() => {
    client = createMockReplayClient() as any;

    // Clear and recreate cached data between tests.
    const module = require("./ExceptionsCache");
    didExceptionsFailTooManyPoints = module.didExceptionsFailTooManyPoints;
    getExceptions = module.getExceptions;
  });

  afterEach(() => {
    jest.resetModules();
  });

  it("should handle empty range", async () => {
    const exceptions = await getExceptionsHelper(toTSPR(1, 1));

    expect(exceptions).toEqual([]);
    expect(exceptions).toBe(await getExceptionsHelper(toTSPR(1, 1)));

    expect(client.runAnalysis).not.toHaveBeenCalled();
  });

  it("should handle an empty array of exceptions", async () => {
    client.runAnalysis.mockImplementation(() => Promise.resolve([]));

    const exceptions = await getExceptionsHelper(toTSPR(1, 2));
    expect(exceptions).toEqual([]);
    expect(exceptions).toBe(await getExceptionsHelper(toTSPR(1, 2)));

    expect(client.runAnalysis).toHaveBeenCalledTimes(1);

    expect(didExceptionsFailTooManyPoints()).toBe(false);
  });

  it("should reuse cached exceptions when there is no focus range", async () => {
    client.runAnalysis.mockImplementation(() =>
      Promise.resolve([createUE(0), createUE(1), createUE(2), createUE(3)])
    );

    const exceptions = await getExceptionsHelper(null);
    expect(exceptions.map(({ time }) => time)).toEqual([0, 1, 2, 3]);
    expect(exceptions).toBe(await getExceptionsHelper(null));

    expect(client.runAnalysis).toHaveBeenCalledTimes(1);

    expect(didExceptionsFailTooManyPoints()).toBe(false);
  });

  it("should reuse cached exceptions for the same focus range", async () => {
    client.runAnalysis.mockImplementation(() =>
      Promise.resolve([createUE(0), createUE(1), createUE(2), createUE(3)])
    );

    const exceptions = await getExceptionsHelper(toTSPR(1, 2));
    expect(exceptions.map(({ time }) => time)).toEqual([1, 2]);
    expect(exceptions).toBe(await getExceptionsHelper(toTSPR(1, 2)));

    expect(client.runAnalysis).toHaveBeenCalledTimes(1);

    expect(didExceptionsFailTooManyPoints()).toBe(false);
  });

  it("should handle a too many exception points", async () => {
    client.runAnalysis.mockImplementation(() => Promise.reject(createCE()));

    const exceptions = await getExceptionsHelper(toTSPR(1, 2));
    expect(exceptions).toEqual([]);
    expect(exceptions).toBe(await getExceptionsHelper(toTSPR(1, 2)));

    expect(client.runAnalysis).toHaveBeenCalledTimes(1);

    expect(didExceptionsFailTooManyPoints()).toBe(true);
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

    expect(didExceptionsFailTooManyPoints()).toBe(false);
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

    expect(didExceptionsFailTooManyPoints()).toBe(false);
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

    expect(didExceptionsFailTooManyPoints()).toBe(false);
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

    expect(didExceptionsFailTooManyPoints()).toBe(false);
  });

  it("should always re-request if focus region changes after too many points error", async () => {
    client.runAnalysis.mockImplementation(() => Promise.reject(createCE()));

    let exceptions = await getExceptionsHelper(toTSPR(0, 3));
    expect(exceptions).toEqual([]);
    expect(didExceptionsFailTooManyPoints()).toBe(true);
    expect(client.runAnalysis).toHaveBeenCalledTimes(1);

    exceptions = await getExceptionsHelper(toTSPR(1, 3));
    expect(exceptions).toEqual([]);
    expect(didExceptionsFailTooManyPoints()).toBe(true);
    expect(client.runAnalysis).toHaveBeenCalledTimes(2);

    exceptions = await getExceptionsHelper(toTSPR(1, 2));
    expect(exceptions).toEqual([]);
    expect(didExceptionsFailTooManyPoints()).toBe(true);
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
    } catch (error) {}

    client.runAnalysis.mockImplementation(() => promise2);
    try {
      getExceptions(client as any as ReplayClientInterface, toTSPR(2, 3));
    } catch (error) {}

    resolvePromise2();
    await promise2;

    resolvePromise1();
    await promise1;

    const exceptions = await getExceptionsHelper(toTSPR(2, 3));
    expect(exceptions.map(({ time }) => time)).toEqual([2, 3]);
    expect(didExceptionsFailTooManyPoints()).toBe(false);
    expect(client.runAnalysis).toHaveBeenCalledTimes(2);
  });

  it("should re-use the in-flight promise if the same focus range is specified", async () => {
    let resolvePromise: any;

    const promise = new Promise(resolve => {
      resolvePromise = () => resolve([]);
    });

    client.runAnalysis.mockImplementation(() => promise);
    getExceptionsHelper(toTSPR(0, 1));
    getExceptionsHelper(toTSPR(0, 1));
    getExceptionsHelper(toTSPR(0, 1));

    expect(client.runAnalysis).toHaveBeenCalledTimes(1);
  });
});
