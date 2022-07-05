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
        contentHash: undefined,
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
        contentHash: undefined,
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
        contentHash: undefined,
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
