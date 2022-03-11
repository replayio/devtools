import { getAutocompleteMatches } from "./autocomplete";
import { ValueFront } from "../../../../protocol/value";

const MOCK_SCOPE = {
  bindings: [
    {
      name: "foo",
      value: new ValueFront(null, {
        _object: {
          className: "Object",
          preview: { properties: [{ name: "bar" }, { name: "baz" }] },
        },
      }),
    },
  ],
  parent: {},
};

describe("autocomplete", () => {
  test("should match a declared variable in the local scope", () => {
    const input = "foo";
    expect(getAutocompleteMatches(input, MOCK_SCOPE)).toEqual(["foo"]);
  });
  test("should show the parent expression's properties when using dot notation", () => {
    expect(getAutocompleteMatches("foo.", MOCK_SCOPE)).toEqual(["bar", "baz"]);
    expect(getAutocompleteMatches("foo.b", MOCK_SCOPE)).toEqual(["bar", "baz"]);
    expect(getAutocompleteMatches("foo.bar", MOCK_SCOPE)).toEqual(["bar"]);
  });
  test("should show the parent expression's properties when using bracket notation", () => {
    expect(getAutocompleteMatches(`foo["`, MOCK_SCOPE)).toEqual(["bar", "baz"]);
    expect(getAutocompleteMatches(`foo["b`, MOCK_SCOPE)).toEqual(["bar", "baz"]);
    expect(getAutocompleteMatches(`foo["bar`, MOCK_SCOPE)).toEqual(["bar"]);
  });
  test("should start autocompleting a bracket notation expression even before a quotation mark is added", () => {
    expect(getAutocompleteMatches("foo[", MOCK_SCOPE)).toEqual(["bar", "baz"]);
  });
  test("should handle bracket notation expressions that start with a single quotation mark", () => {
    expect(getAutocompleteMatches("foo['", MOCK_SCOPE)).toEqual(["bar", "baz"]);
  });
});
