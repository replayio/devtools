import { Property, Scope } from "@replayio/protocol";

import { WeightedProperty } from "replay-next/components/lexical/plugins/code-completion/findMatches";

import findMatches from "./findMatchingScopesAndProperties";

function createPropertiesFromNames(...names: string[]): WeightedProperty[] {
  return names.map(name => {
    let distance = 0;
    if (name.indexOf(":") >= 0) {
      const pieces = name.split(":");
      name = pieces[0];
      distance = parseInt(pieces[1], 10);
    }

    return {
      distance,
      name,
    };
  });
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

  it("should sort matches to emphasize properties that begin with the substring", () => {
    expect(
      findMatches(
        "foo",
        "bar",
        null,
        createPropertiesFromNames("zbar", "aaaaabar", "bar", "baraaa")
      )
    ).toEqual(["bar", "baraaa", "aaaaabar", "zbar"]);
  });

  it("should sort matches to emphasize properties with more consecutive matching substring characters", () => {
    expect(
      findMatches("foo", "bar", null, createPropertiesFromNames("bbaaarr", "abarr", "cbar"))
    ).toEqual(["abarr", "cbar", "bbaaarr"]);
  });

  it("should sort properties with casing matches earlier", () => {
    expect(
      findMatches("", "array", null, createPropertiesFromNames("Array", "array", "UintArray"))
    ).toEqual(["array", "Array", "UintArray"]);
    expect(
      findMatches("", "Array", null, createPropertiesFromNames("Array", "array", "UintArray"))
    ).toEqual(["Array", "array", "UintArray"]);
  });

  // FE-1133
  it("should not suggest array indices or any other names that require bracket notations", () => {
    const properties = createPropertiesFromNames(
      "0",
      "1",
      "2",
      "foo",
      "foo-bar",
      "foo_bar",
      "qux2"
    );
    const scopes = createScopesFromNames();

    expect(findMatches("array", null, scopes, properties)).toEqual(["foo", "foo_bar", "qux2"]);
    expect(findMatches("array", "2", scopes, properties)).toEqual(["qux2"]);
  });

  // FE-1169
  it("should display matches for an object's own properties above inherited properties", () => {
    const properties = createPropertiesFromNames("foo:0", "fooBar:1", "fooBaz:1", "fooBarBaz:2");
    const scopes = createScopesFromNames();

    expect(findMatches("array", null, scopes, properties)).toEqual([
      "foo",
      "fooBar",
      "fooBaz",
      "fooBarBaz",
    ]);
    expect(findMatches("array", "fooB", scopes, properties)).toEqual([
      "fooBar",
      "fooBaz",
      "fooBarBaz",
    ]);
  });
});
