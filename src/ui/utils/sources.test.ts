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
        contentHash: "contentHash#1",
        correspondingSourceIds: ["1"],
        generated: [],
        generatedFrom: [],
        id: "1",
        kind: "scriptSource",
        prettyPrinted: undefined,
        prettyPrintedFrom: undefined,
        isSourceMapped: false,
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
        contentHash: "contentHash#1",
        correspondingSourceIds: ["1"],
        generated: [],
        generatedFrom: ["o1"],
        id: "1",
        kind: "scriptSource",
        prettyPrinted: undefined,
        prettyPrintedFrom: undefined,
        isSourceMapped: false,
        url: "/index.js",
      },
      o1: {
        contentHash: "contentHash#o1",
        correspondingSourceIds: ["o1"],
        generated: ["1"],
        generatedFrom: [],
        id: "o1",
        kind: "sourceMapped",
        prettyPrinted: undefined,
        prettyPrintedFrom: undefined,
        isSourceMapped: true,
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
        contentHash: "contentHash#1",
        correspondingSourceIds: ["1"],
        generated: [],
        generatedFrom: ["pp1"],
        id: "1",
        kind: "scriptSource",
        prettyPrinted: "pp1",
        prettyPrintedFrom: undefined,
        isSourceMapped: false,
        url: "/index.js",
      },
      pp1: {
        contentHash: "contentHash#1",
        correspondingSourceIds: ["pp1"],
        generated: ["1"],
        generatedFrom: [],
        id: "pp1",
        kind: "prettyPrinted",
        prettyPrinted: undefined,
        prettyPrintedFrom: "1",
        isSourceMapped: false,
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
        contentHash: "contentHash#1",
        correspondingSourceIds: ["1"],
        generated: [],
        generatedFrom: ["o1", "pp1"],
        id: "1",
        kind: "scriptSource",
        prettyPrinted: "pp1",
        prettyPrintedFrom: undefined,
        isSourceMapped: false,
        url: "/index.js",
      },
      o1: {
        contentHash: "contentHash#o1",
        correspondingSourceIds: ["o1"],
        generated: ["1"],
        generatedFrom: ["ppo1"],
        id: "o1",
        kind: "sourceMapped",
        prettyPrinted: "ppo1",
        prettyPrintedFrom: undefined,
        isSourceMapped: true,
        url: "/src/index.ts",
      },
      pp1: {
        contentHash: "contentHash#1",
        correspondingSourceIds: ["pp1"],
        generated: ["1"],
        generatedFrom: [],
        id: "pp1",
        kind: "prettyPrinted",
        prettyPrinted: undefined,
        prettyPrintedFrom: "1",
        isSourceMapped: false,
        url: "/src/index.js",
      },
      ppo1: {
        contentHash: "contentHash#o1",
        correspondingSourceIds: ["ppo1"],
        generated: ["o1"],
        generatedFrom: [],
        id: "ppo1",
        kind: "prettyPrinted",
        prettyPrinted: undefined,
        prettyPrintedFrom: "o1",
        isSourceMapped: true,
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
        contentHash: "contentHash#2",
        correspondingSourceIds: ["2"],
        generated: [],
        generatedFrom: ["h1"],
        id: "2",
        kind: "inlineScript",
        prettyPrinted: undefined,
        prettyPrintedFrom: undefined,
        isSourceMapped: false,
        url: "/index.html",
      },
      h1: {
        contentHash: "contentHash#h1",
        correspondingSourceIds: ["h1"],
        generated: ["2"],
        generatedFrom: [],
        id: "h1",
        kind: "html",
        prettyPrinted: undefined,
        prettyPrintedFrom: undefined,
        isSourceMapped: false,
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
      contentHash: "contentHash",
      correspondingSourceIds: ["h1", "h2"],
      generated: [],
      generatedFrom: [],
      id: "h1",
      kind: "html",
      prettyPrinted: undefined,
      prettyPrintedFrom: undefined,
      isSourceMapped: false,
      url: "/index.html",
    },
    h2: {
      contentHash: "contentHash",
      correspondingSourceIds: ["h1", "h2"],
      generated: [],
      generatedFrom: [],
      id: "h2",
      kind: "html",
      prettyPrinted: undefined,
      prettyPrintedFrom: undefined,
      isSourceMapped: false,
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
      contentHash: "contentHash#h1",
      correspondingSourceIds: ["h1"],
      generated: [],
      generatedFrom: ["pph1"],
      id: "h1",
      kind: "html",
      prettyPrinted: "pph1",
      prettyPrintedFrom: undefined,
      isSourceMapped: false,
      url: "/index.html",
    },
    h2: {
      contentHash: "contentHash#h2",
      correspondingSourceIds: ["h2"],
      generated: [],
      generatedFrom: ["pph2"],
      id: "h2",
      kind: "html",
      prettyPrinted: "pph2",
      prettyPrintedFrom: undefined,
      isSourceMapped: false,
      url: "/index.html",
    },
    pph1: {
      contentHash: "contentHash#h1",
      correspondingSourceIds: ["pph1"],
      generated: ["h1"],
      generatedFrom: [],
      id: "pph1",
      kind: "prettyPrinted",
      prettyPrinted: undefined,
      prettyPrintedFrom: "h1",
      isSourceMapped: false,
      url: "/index.html",
    },
    pph2: {
      contentHash: "contentHash#h2",
      correspondingSourceIds: ["pph2"],
      generated: ["h2"],
      generatedFrom: [],
      id: "pph2",
      kind: "prettyPrinted",
      prettyPrinted: undefined,
      prettyPrintedFrom: "h2",
      isSourceMapped: false,
      url: "/index.html",
    },
  });
});
