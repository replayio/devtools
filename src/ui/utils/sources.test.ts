import { newSource } from "@replayio/protocol";
import { ThreadFront } from "protocol/thread";
import { newSourcesToCompleteSourceDetails } from "./sources";

describe("newSourcesToCompleteSourceDetails", () => {
  it("should return empty array when no sources", () => {
    expect(newSourcesToCompleteSourceDetails([])).toEqual({});
  });

  it("should be able to return a complete source from a single newSource event", () => {
    expect(
      newSourcesToCompleteSourceDetails([
        {
          contentHash: "contentHash#1",
          kind: "scriptSource",
          sourceId: "1",
          url: "/index.js",
        },
      ])
    ).toEqual({
      "1": {
        canonicalId: "1",
        contentHash: "contentHash#1",
        correspondingSourceIds: ["1"],
        generated: [],
        generatedFrom: [],
        id: "1",
        kind: "scriptSource",
        prettyPrinted: undefined,
        prettyPrintedFrom: undefined,
        url: "/index.js",
      },
    });
  });

  it("can backlink generated sources properly", () => {
    expect(
      newSourcesToCompleteSourceDetails([
        {
          contentHash: "contentHash#1",
          kind: "scriptSource",
          sourceId: "1",
          url: "/index.js",
        },
        {
          contentHash: "contentHash#o1",
          kind: "sourceMapped",
          sourceId: "o1",
          generatedSourceIds: ["1"],
          url: "/index.ts",
        },
      ])
    ).toEqual({
      "1": {
        canonicalId: "o1",
        contentHash: "contentHash#1",
        correspondingSourceIds: ["1"],
        generated: [],
        generatedFrom: ["o1"],
        id: "1",
        kind: "scriptSource",
        prettyPrinted: undefined,
        prettyPrintedFrom: undefined,
        url: "/index.js",
      },
      o1: {
        canonicalId: "o1",
        contentHash: "contentHash#o1",
        correspondingSourceIds: ["o1"],
        generated: ["1"],
        generatedFrom: [],
        id: "o1",
        kind: "sourceMapped",
        prettyPrinted: undefined,
        prettyPrintedFrom: undefined,
        url: "/index.ts",
      },
    });
  });

  it("can link pretty-printed and minified sources", () => {
    expect(
      newSourcesToCompleteSourceDetails([
        {
          contentHash: "contentHash#1",
          kind: "scriptSource",
          sourceId: "1",
          url: "/index.js",
        },
        {
          generatedSourceIds: ["1"],
          kind: "prettyPrinted",
          sourceId: "pp1",
          url: "/src/index.js",
        },
      ])
    ).toEqual({
      "1": {
        canonicalId: "1",
        contentHash: "contentHash#1",
        correspondingSourceIds: ["1"],
        generated: [],
        generatedFrom: [],
        id: "1",
        kind: "scriptSource",
        prettyPrinted: "pp1",
        prettyPrintedFrom: undefined,
        url: "/index.js",
      },
      pp1: {
        canonicalId: "1",
        contentHash: "contentHash#1",
        correspondingSourceIds: ["pp1"],
        generated: [],
        generatedFrom: [],
        id: "pp1",
        kind: "prettyPrinted",
        prettyPrinted: undefined,
        prettyPrintedFrom: "1",
        url: "/src/index.js",
      },
    });
  });

  it("can combine original, generated, and pretty-printed sources", () => {
    expect(
      newSourcesToCompleteSourceDetails([
        {
          contentHash: "contentHash#1",
          kind: "scriptSource",
          sourceId: "1",
          url: "/index.js",
        },
        {
          contentHash: "contentHash#o1",
          generatedSourceIds: ["1"],
          kind: "sourceMapped",
          sourceId: "o1",
          url: "/src/index.ts",
        },
        {
          generatedSourceIds: ["1"],
          kind: "prettyPrinted",
          sourceId: "pp1",
          url: "/src/index.js",
        },
        {
          generatedSourceIds: ["o1"],
          kind: "prettyPrinted",
          sourceId: "ppo1",
          url: "/src/index.ts",
        },
      ])
    ).toEqual({
      "1": {
        canonicalId: "o1",
        contentHash: "contentHash#1",
        correspondingSourceIds: ["1"],
        generated: [],
        generatedFrom: ["o1"],
        id: "1",
        kind: "scriptSource",
        prettyPrinted: "pp1",
        prettyPrintedFrom: undefined,
        url: "/index.js",
      },
      o1: {
        canonicalId: "o1",
        contentHash: "contentHash#o1",
        correspondingSourceIds: ["o1"],
        generated: ["1"],
        generatedFrom: [],
        id: "o1",
        kind: "sourceMapped",
        prettyPrinted: "ppo1",
        prettyPrintedFrom: undefined,
        url: "/src/index.ts",
      },
      pp1: {
        canonicalId: "o1",
        contentHash: "contentHash#1",
        correspondingSourceIds: ["pp1"],
        generated: [],
        generatedFrom: [],
        id: "pp1",
        kind: "prettyPrinted",
        prettyPrinted: undefined,
        prettyPrintedFrom: "1",
        url: "/src/index.js",
      },
      ppo1: {
        canonicalId: "o1",
        contentHash: "contentHash#o1",
        correspondingSourceIds: ["ppo1"],
        generated: [],
        generatedFrom: [],
        id: "ppo1",
        kind: "prettyPrinted",
        prettyPrinted: undefined,
        prettyPrintedFrom: "o1",
        url: "/src/index.ts",
      },
    });
  });

  it("can put together HTML sources and their extracted scripts", () => {
    expect(
      newSourcesToCompleteSourceDetails([
        {
          contentHash: "contentHash#h1",
          kind: "html",
          sourceId: "h1",
          generatedSourceIds: ["2"],
          url: "/index.html",
        },
        {
          contentHash: "contentHash#2",
          kind: "inlineScript",
          sourceId: "2",
          url: "/index.html",
        },
      ])
    ).toEqual({
      "2": {
        canonicalId: "h1",
        contentHash: "contentHash#2",
        correspondingSourceIds: ["2"],
        generated: [],
        generatedFrom: ["h1"],
        id: "2",
        kind: "inlineScript",
        prettyPrinted: undefined,
        prettyPrintedFrom: undefined,
        url: "/index.html",
      },
      h1: {
        canonicalId: "h1",
        contentHash: "contentHash#h1",
        correspondingSourceIds: ["h1"],
        generated: ["2"],
        generatedFrom: [],
        id: "h1",
        kind: "html",
        prettyPrinted: undefined,
        prettyPrintedFrom: undefined,
        url: "/index.html",
      },
    });
  });
});

it("can link corresponding sources", () => {
  expect(
    newSourcesToCompleteSourceDetails([
      {
        contentHash: "contentHash",
        kind: "html",
        sourceId: "h1",
        url: "/index.html",
      },
      {
        contentHash: "contentHash",
        kind: "html",
        sourceId: "h2",
        url: "/index.html",
      },
    ])
  ).toEqual({
    h1: {
      canonicalId: "h1",
      contentHash: "contentHash",
      correspondingSourceIds: ["h1", "h2"],
      generated: [],
      generatedFrom: [],
      id: "h1",
      kind: "html",
      prettyPrinted: undefined,
      prettyPrintedFrom: undefined,
      url: "/index.html",
    },
    h2: {
      canonicalId: "h2",
      contentHash: "contentHash",
      correspondingSourceIds: ["h1", "h2"],
      generated: [],
      generatedFrom: [],
      id: "h2",
      kind: "html",
      prettyPrinted: undefined,
      prettyPrintedFrom: undefined,
      url: "/index.html",
    },
  });
});

it("is not fooled by pretty-printed sources with missing contentHashes", () => {
  expect(
    newSourcesToCompleteSourceDetails([
      {
        contentHash: "contentHash#h1",
        kind: "html",
        sourceId: "h1",
        url: "/index.html",
      },
      {
        generatedSourceIds: ["h1"],
        kind: "prettyPrinted",
        sourceId: "pph1",
        url: "/index.html",
      },
      {
        contentHash: "contentHash#h2",
        kind: "html",
        sourceId: "h2",
        url: "/index.html",
      },
      {
        kind: "prettyPrinted",
        generatedSourceIds: ["h2"],
        sourceId: "pph2",
        url: "/index.html",
      },
    ])
  ).toEqual({
    h1: {
      canonicalId: "h1",
      contentHash: "contentHash#h1",
      correspondingSourceIds: ["h1"],
      generated: [],
      generatedFrom: [],
      id: "h1",
      kind: "html",
      prettyPrinted: "pph1",
      prettyPrintedFrom: undefined,
      url: "/index.html",
    },
    h2: {
      canonicalId: "h2",
      contentHash: "contentHash#h2",
      correspondingSourceIds: ["h2"],
      generated: [],
      generatedFrom: [],
      id: "h2",
      kind: "html",
      prettyPrinted: "pph2",
      prettyPrintedFrom: undefined,
      url: "/index.html",
    },
    pph1: {
      canonicalId: "h1",
      contentHash: "contentHash#h1",
      correspondingSourceIds: ["pph1"],
      generated: [],
      generatedFrom: [],
      id: "pph1",
      kind: "prettyPrinted",
      prettyPrinted: undefined,
      prettyPrintedFrom: "h1",
      url: "/index.html",
    },
    pph2: {
      canonicalId: "h2",
      contentHash: "contentHash#h2",
      correspondingSourceIds: ["pph2"],
      generated: [],
      generatedFrom: [],
      id: "pph2",
      kind: "prettyPrinted",

      prettyPrinted: undefined,
      prettyPrintedFrom: "h2",
      url: "/index.html",
    },
  });
});

describe("ThreadFront source methods", () => {
  beforeAll(() => {
    (
      [
        {
          contentHash: "contentHash#1",
          kind: "scriptSource",
          sourceId: "1",
          url: "/index.js",
        },
        {
          contentHash: "contentHash",
          kind: "html",
          sourceId: "h1",
          generatedSourceIds: ["2"],
          url: "/index.html",
        },
        {
          contentHash: "contentHash",
          kind: "html",
          sourceId: "h2",
          url: "/index.html",
        },
        {
          contentHash: "contentHash#2",
          kind: "inlineScript",
          sourceId: "2",
          url: "/index.html",
        },
      ] as newSource[]
    ).forEach(s => ThreadFront._newSourceListener(s));
    ThreadFront.hasAllSources = true;
    ThreadFront.groupSourceIds();
  });

  describe("getSourceIdsForUrl", () => {
    it("returns original versions of sources for the given URL", () => {
      expect(ThreadFront.getSourceIdsForURL("/index.js")).toEqual(["1"]);
      expect(ThreadFront.getSourceIdsForURL("/index.html")).toEqual(["h1", "h2"]);
    });
  });

  describe("getChosenSourceIdsForUrl", () => {
    it("returns the preferred and alternate sourceIds", () => {
      ThreadFront.preferSource("2", true);
      expect(ThreadFront.getChosenSourceIdsForUrl("/index.js")).toEqual([{ sourceId: "1" }]);
      expect(ThreadFront.getChosenSourceIdsForUrl("/index.html")).toEqual([
        { sourceId: "h1" },
        { sourceId: "h2" },
      ]);
      expect(ThreadFront.getChosenSourceIdsForUrl("/index.js")).toEqual([{ sourceId: "1" }]);
    });
  });

  describe("getCorrespondingSourceIds", () => {
    it("returns the preferred and alternate sourceIds", () => {
      expect(ThreadFront.getCorrespondingSourceIds("1")).toEqual(["1"]);
      expect(ThreadFront.getCorrespondingSourceIds("h1")).toEqual(["h1", "h2"]);
    });
  });

  describe("getSourceURLRaw", () => {
    it("returns the URL of the source", () => {
      expect(ThreadFront.getSourceURLRaw("1")).toEqual("/index.js");
    });
  });

  describe("getSourceURL", () => {
    it("returns the URL of the source", () => {
      expect(ThreadFront.getSourceURLRaw("1")).toEqual("/index.js");
    });
  });

  describe("getGeneratedSourceIdsForURL", () => {
    // This one seems odd to me?
    it("returns the URL of the generated sources", () => {
      expect(ThreadFront.getGeneratedSourceIdsForURL("/index.js")).toEqual(["1"]);
      expect(ThreadFront.getGeneratedSourceIdsForURL("/index.html")).toEqual(["h2", "2"]);
    });
  });

  describe("getGeneratedSourceIds", () => {
    // Why doesn't this line up with the getGeneratedSourceIdsForURL at all?
    // Also, it just so happens that this is only used by SmartTrace which is
    // only used by the console and object inspector, so if we rip out old
    // console code this code will be dead.
    it("returns the URL of the generated sources", () => {
      expect(ThreadFront.getGeneratedSourceIds("1")).toEqual(undefined);
      expect(ThreadFront.getGeneratedSourceIds("2")).toEqual(undefined);
      expect(ThreadFront.getGeneratedSourceIds("h1")).toEqual(["2"]);
    });
  });

  describe("getGeneratedLocation", () => {
    const location = (sourceId: string) => {
      return {
        sourceId,
        line: 1,
        column: 1,
      };
    };
    it("returns the generated location?", () => {
      // This method assumes that if any source has no "generatedSourceIds"
      // attached then *it* must be a generated location. Which is only true if
      // you assume that this is a set of locations with exactly one generated
      // source I think? Checking `generatedFrom` would be better, but maybe we
      // can find a more exact method to solve the problems this is currently
      // solving.
      // Only used by
      // packages/protocol/thread/value.ts:387
      expect(
        ThreadFront.getGeneratedLocation([location("1"), location("h2"), location("2")])
      ).toEqual(location("1"));
    });
  });
});
