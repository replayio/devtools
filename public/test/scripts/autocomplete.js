Test.describe(`Test autocomplete in the console.`, async () => {
  await Test.selectConsole();
  await Test.warpToMessage("Done");

  const objectProperties = Object.getOwnPropertyNames(Object.prototype);
  window.jsterm.showAutocomplete(true);

  // show all properties (including getters) of an object in the current scope
  await Test.writeInConsole("r.");
  let expectedMatches = [...objectProperties, "_foo", "foo"];
  await Test.checkAutocompleteMatches(expectedMatches);

  // show all properties (including getters) of a nested object
  await Test.writeInConsole("r.foo.");
  expectedMatches = [...objectProperties, "bar", "baz"];
  await Test.checkAutocompleteMatches(expectedMatches);

  // show matching properties (including getters) of a nested object
  await Test.writeInConsole("r.foo.ba");
  expectedMatches = ["bar", "baz"];
  await Test.checkAutocompleteMatches(expectedMatches);

  // show all properties (including getters) of a nested object
  // using bracket notation without a quotation mark
  await Test.writeInConsole("r.foo[");
  expectedMatches = [...objectProperties, "bar", "baz"];
  await Test.checkAutocompleteMatches(expectedMatches);

  // clear the autocomplete matches before the next test
  // because it expects the same matches as the previous one
  await Test.writeInConsole("");
  await Test.checkAutocompleteMatches([]);

  // show all properties (including getters) of a nested object
  // using bracket notation with a double quotation mark
  await Test.writeInConsole('r.foo["');
  expectedMatches = [...objectProperties, "bar", "baz"];
  await Test.checkAutocompleteMatches(expectedMatches);

  // show matching properties (including getters) of a nested object
  // using bracket notation with a double quotation mark
  await Test.writeInConsole('r.foo["ba');
  expectedMatches = ["bar", "baz"];
  await Test.checkAutocompleteMatches(expectedMatches);

  // show all properties (including getters) of a nested object
  // using bracket notation with a single quotation mark
  await Test.writeInConsole("r.foo['");
  expectedMatches = [...objectProperties, "bar", "baz"];
  await Test.checkAutocompleteMatches(expectedMatches);
});
