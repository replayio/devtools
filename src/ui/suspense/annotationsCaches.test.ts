import { Interaction, Location } from "@replayio/protocol";

import { createMockReplayClient } from "replay-next/src/utils/testing";
import {
  ParsedJumpToCodeAnnotation,
  listenerPointCache,
  processInteractions,
} from "ui/suspense/annotationsCaches";

const firstBreakablePosition: Location = { sourceId: "2", line: 10, column: 4 };

function createInteraction(point: string, overrides: Partial<Interaction> = {}): Interaction {
  return {
    point,
    time: Number(point) / 100,
    kind: "mousedown",
    handler: {
      location: [
        { sourceId: "1", line: 3, column: 0 },
        { sourceId: "2", line: 10, column: 2 },
      ],
      functionName: "onClick",
      firstBreakablePosition,
      listenerPoint: `${point}5`,
    },
    ...overrides,
  };
}

describe("processInteractions", () => {
  test("maps interactions with handlers to jump-to-code annotations sorted by point", () => {
    expect(
      processInteractions([
        createInteraction("2000", { kind: "keypress" }),
        createInteraction("300"),
      ])
    ).toEqual([
      {
        point: "300",
        time: 3,
        eventKind: "mousedown",
        listenerPoint: "3005",
        eventListener: {
          type: "mousedown",
          functionName: "onClick",
          location: { sourceId: "2", line: 10, column: 2 },
          firstBreakablePosition,
          functionParameterNames: [],
        },
      },
      expect.objectContaining({ point: "2000", eventKind: "keypress", listenerPoint: "20005" }),
    ]);
  });

  test("skips interactions without a handler", () => {
    expect(processInteractions([createInteraction("100", { handler: undefined })])).toEqual([]);
  });

  test("falls back to the first mapped location and an empty function name", () => {
    const [annotation] = processInteractions([
      createInteraction("100", {
        handler: {
          location: [{ sourceId: "1", line: 3, column: 0 }],
          firstBreakablePosition,
          listenerPoint: "105",
        },
      }),
    ]);
    expect(annotation.eventListener.location).toEqual({ sourceId: "1", line: 3, column: 0 });
    expect(annotation.eventListener.functionName).toBe("");
  });
});

describe("listenerPointCache", () => {
  function createAnnotation(
    point: string,
    listenerPoint: ParsedJumpToCodeAnnotation["listenerPoint"]
  ): ParsedJumpToCodeAnnotation {
    return {
      point,
      time: 1,
      eventKind: "mousedown",
      listenerPoint,
      eventListener: {
        type: "mousedown",
        functionName: "onClick",
        location: firstBreakablePosition,
        firstBreakablePosition,
        functionParameterNames: [],
      },
    };
  }

  test("returns a time-stamped listener point as is", async () => {
    const client = createMockReplayClient();
    const listenerPoint = { point: "15", time: 1.5 };
    await expect(
      listenerPointCache.readAsync(client, createAnnotation("10", listenerPoint))
    ).resolves.toEqual(listenerPoint);
    expect(client.findPoints).not.toHaveBeenCalled();
  });

  test("looks up the time of a bare listener point", async () => {
    const client = createMockReplayClient();
    client.findPoints.mockImplementation(async () => [{ point: "25", time: 2.5, frame: [] }]);

    await expect(
      listenerPointCache.readAsync(client, createAnnotation("20", "25"))
    ).resolves.toEqual({ point: "25", time: 2.5 });
    expect(client.findPoints).toHaveBeenCalledWith(
      { kind: "location", location: firstBreakablePosition },
      { begin: "25", end: "25" }
    );
  });
});
