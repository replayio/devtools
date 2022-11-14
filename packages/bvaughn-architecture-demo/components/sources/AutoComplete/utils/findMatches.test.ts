import { Property, Scope } from "@replayio/protocol";

import findMatches from "./findMatches";

function createPropertiesFromNames(...names: string[]): Property[] {
  return names.map(name => ({
    name,
  }));
}

function createScopesFromNames(...names: string[]): Scope[] {
  return names.map((name, index) => ({
    scopeId: `${index}`,
    type: "block",
    bindings: [{ name }],
  }));
}

describe("findMatches", () => {
  it("should return no matches if there is no text to match on", () => {
    expect(
      findMatches(
        null,
        null,
        createScopesFromNames("b", "a", "c"),
        createPropertiesFromNames("f", "e", "d")
      )
    ).toEqual(null);
  });

  it("should return all properties if there is no filter string", () => {
    expect(
      findMatches(
        "object",
        null,
        createScopesFromNames("b", "a", "c"),
        createPropertiesFromNames("f", "e", "d")
      )
    ).toEqual(["d", "e", "f"]);
  });

  it("should fuzzy match within properties when there are both head and tail expressions", () => {
    expect(
      findMatches(
        "foo",
        "fb",
        createScopesFromNames("fb"),
        createPropertiesFromNames("foobar", "fobar")
      )
    ).toEqual(["fobar", "foobar"]);
  });

  it("should fuzzy match within scopes and properties if there's no head expression", () => {
    expect(
      findMatches(
        null,
        "fb",
        createScopesFromNames("foobar", "fobar"),
        createPropertiesFromNames("fb")
      )
    ).toEqual(["fb", "fobar", "foobar"]);
  });

  it("should sort matches to emphasize properties that match earlier in the substring", () => {
    expect(
      findMatches(
        "foo",
        "bar",
        null,
        createPropertiesFromNames("zbar", "aaaaabar", "bar", "baraaa")
      )
    ).toEqual(["bar", "baraaa", "zbar", "aaaaabar"]);
  });

  it("should sort matches to emphasize properties with more consecutive matching substring characters", () => {
    expect(
      findMatches("foo", "bar", null, createPropertiesFromNames("bbaaarr", "abarr", "cbar"))
    ).toEqual(["cbar", "abarr", "bbaaarr"]);
  });
});
