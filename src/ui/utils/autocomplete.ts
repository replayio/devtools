import { Scope as ProtocolScope, Object as ProtocolObject } from "@replayio/protocol";
import { parseExpression } from "@babel/parser";
import {
  isIdentifier as _isIdentifier,
  isMemberExpression as _isMemberExpression,
  isStringLiteral as _isStringLiteral,
  isCallExpression as _isCallExpression,
  StringLiteral,
  Identifier,
  CallExpression,
} from "@babel/types";
import generate from "@babel/generator";
import { filter } from "fuzzaldrin-plus";

type PropertyExpression = {
  left: string;
  right: string;
  computed: boolean;
};

export type ObjectFetcher = (objectId: string) => Promise<ProtocolObject>;

// This is used as a property name placeholder for what they user could
//  be trying to type or find the autocomplete match to.
const PROPERTY_PLACEHOLDER = "fakeProperty";

function escapeRegex(string: string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

// Trims quotation marks from the string. This allows us to match
// bracket notation properties regardless of whether the user has quotation
// marks or not. i.e., `foo["ba` vs `foo[ba` will both show "bar" as
// an autocomplete match.
export function normalizeString(str: string) {
  return str.toLowerCase().replace(/['"`]+/g, "");
}
export function fuzzyFilter(candidates: string[], query: string): string[] {
  if (normalizeString(query) === "") {
    return candidates;
  }
  return filter(candidates, query);
}

function isIdentifier(expression: string) {
  try {
    return _isIdentifier(parseExpression(expression));
  } catch (e) {
    return false;
  }
}
function isMemberExpression(expression: string) {
  try {
    return _isMemberExpression(parseExpression(expression));
  } catch (e) {
    return false;
  }
}
function isCallExpression(expression: string) {
  try {
    return _isCallExpression(parseExpression(expression));
  } catch (e) {
    return false;
  }
}

// Try out to all possible bracket notation endings and see if
// that produces a valid member expression.
function tryToAutocompleteComputedProperty(str: string) {
  const endings = [`]`, `"]`, `""]`, `']`, `'']`];
  const ending = endings.find(e => isMemberExpression(str + e));

  return ending ? str + ending : "";
}
export function isBracketNotation(str: string) {
  return !!tryToAutocompleteComputedProperty(str);
}
export function isDotNotation(str: string) {
  return isMemberExpression(str + PROPERTY_PLACEHOLDER);
}

const OBJECT_PROTOTYPE_PROPERTIES = Object.getOwnPropertyNames(Object.prototype);
const ARRAY_PROTOTYPE_PROPERTIES = Object.getOwnPropertyNames(Array.prototype);

export async function getPropertiesForObject(
  objectId: string,
  fetchObjectWithPreview: ObjectFetcher,
  maxDepth = Infinity
): Promise<string[]> {
  const properties = [];

  if (!objectId) {
    return [];
  }

  const object = await fetchObjectWithPreview(objectId);
  // We _should_ have a preview because `fetchObjectWithPreview`
  // asked the object cache to retrieve one
  if (object.preview) {
    const objectProperties = object.preview.properties?.map(b => b.name) ?? [];
    properties.unshift(...objectProperties);
  } else {
    if (["Object", "Array"].includes(object.className)) {
      properties.unshift(...OBJECT_PROTOTYPE_PROPERTIES);
    }

    if (object.className === "Array") {
      properties.unshift(...ARRAY_PROTOTYPE_PROPERTIES);
    }
  }

  const prototypeId = object.preview?.prototypeId;

  // Recursively gather the properties through the prototype chain.
  if (prototypeId && maxDepth > 0) {
    const prototypeProperties = await getPropertiesForObject(
      prototypeId,
      fetchObjectWithPreview,
      maxDepth - 1
    );

    properties.push(...prototypeProperties);
  }

  return properties;
}

function shouldVariableAutocomplete(input: string) {
  return isIdentifier(input);
}

// Looks for the "global object" (ie `window`) and returns its properties
async function getGlobalVariables(scopes: ProtocolScope[], fetchObject: ObjectFetcher) {
  // Scopes are ordered nearest to broadest.
  // _If_ there is a global object, it will be the last scope in the list.
  const [lastScope] = scopes.slice(-1);

  const globalScopeObjectId = lastScope?.object;
  if (!globalScopeObjectId) {
    return [];
  }

  const globalObjectProperties = await getPropertiesForObject(globalScopeObjectId, fetchObject, 1);

  return globalObjectProperties;
}

function getPropertyValue(property: StringLiteral | Identifier) {
  if (_isStringLiteral(property)) {
    return property.value;
  }

  return property.name;
}
export function getPropertyExpression(str: string): PropertyExpression | null {
  if (isDotNotation(str)) {
    const parsed = parseExpression(str + PROPERTY_PLACEHOLDER);

    // To make ts happy.
    if (!_isMemberExpression(parsed) || !_isIdentifier(parsed.property)) {
      return null;
    }

    return {
      left: generate(parsed.object).code,
      right: parsed.property.name.slice(0, -PROPERTY_PLACEHOLDER.length),
      computed: false,
    };
  } else if (isBracketNotation(str)) {
    const placeholderStr = tryToAutocompleteComputedProperty(str);
    const parsed = parseExpression(placeholderStr);

    // To make ts happy.
    if (
      !_isMemberExpression(parsed) ||
      !(_isStringLiteral(parsed.property) || _isIdentifier(parsed.property))
    ) {
      return null;
    }

    return {
      left: generate(parsed.object).code,
      right: getPropertyValue(parsed.property),
      computed: true,
    };
  }

  return null;
}

// Used to figure out the earliest cursor position of the current autocomplete target.
export function getCursorIndex(value: string, isArgument: boolean) {
  const propertyExpression = getPropertyExpression(isArgument ? getLastExpression(value) : value);
  let index;

  if (propertyExpression) {
    // +1 to account for the `.` or `[`
    index = propertyExpression.left.length + 1;
  } else {
    index = 0;
  }

  return isArgument ? value.length - getLastExpression(value).length + index : index;
}
export function insertAutocompleteMatch(value: string, match: string, isArgument: boolean = false) {
  const propertyExpression = getPropertyExpression(isArgument ? getLastExpression(value) : value);
  let autocompletedExpression: string;

  if (propertyExpression) {
    const { left, computed } = propertyExpression;

    if (computed) {
      autocompletedExpression = `${left}["${match}"]`;
    } else {
      autocompletedExpression = `${left}.${match}`;
    }
  } else {
    // For variable autocomplete.
    autocompletedExpression = match;
  }

  return isArgument
    ? autocompleteLastArgument(value, autocompletedExpression)
    : autocompletedExpression;
}
export async function getAutocompleteMatches(
  input: string,
  scopes: ProtocolScope[],
  fetchObjectWithPreview: ObjectFetcher
) {
  const currentScope = scopes[0];
  if (!currentScope) {
    return [];
  }
  const propertyExpression = getPropertyExpression(input);

  if (propertyExpression) {
    const properties: string[] = [];
    const { left, right } = propertyExpression;

    // TODO This only handles top-level variables because of `=== left`.
    // TODO Rework this to handle nested field lookups.
    // TODO This also only looks in the _current_ scope.
    const matchingBinding = currentScope.bindings?.find(b => b.name === left);

    if (matchingBinding?.object) {
      // Assuming this variable name represents an object,
      // fetch its property names up to 1 prototype level deep
      const prototypeProperties = await getPropertiesForObject(
        matchingBinding.object,
        fetchObjectWithPreview,
        1
      );
      properties.push(...prototypeProperties);
    }

    properties.sort();

    return fuzzyFilter(properties, normalizeString(right));
  } else if (shouldVariableAutocomplete(input)) {
    // TODO this only looks in the _current_ scope
    const bindingNames = currentScope.bindings?.map(b => b.name) ?? [];
    const globalVariables = await getGlobalVariables(scopes, fetchObjectWithPreview);

    const variableNames = [...bindingNames, ...globalVariables];
    variableNames.sort();

    return fuzzyFilter(variableNames, normalizeString(input));
  }

  return [];
}
export function getRemainingCompletedTextAfterCursor(value: string, match: string) {
  const propertyExpression = getPropertyExpression(value);

  if (
    !propertyExpression ||
    match.slice(0, propertyExpression.right.length) !== propertyExpression.right
  ) {
    return null;
  }

  return match.slice(propertyExpression.right.length);
}
export function autocompleteLastArgument(expression: string, newLastArg: string) {
  const partialLastArg = getLastExpression(expression);
  return expression.replace(new RegExp(`${escapeRegex(partialLastArg)}$`), newLastArg);
}
export function getLastExpression(exp: string) {
  const expression = `console.log(${exp}${PROPERTY_PLACEHOLDER})`;

  if (isCallExpression(expression)) {
    const parsed = parseExpression(expression) as CallExpression;
    const lastArgNode = parsed.arguments[parsed.arguments.length - 1] as Identifier;
    return expression.slice(lastArgNode.start!, lastArgNode.end! - PROPERTY_PLACEHOLDER.length);
  }

  return exp;
}
