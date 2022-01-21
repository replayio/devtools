import { parseExpression } from "@babel/parser";
import {
  isIdentifier as _isIdentifier,
  isMemberExpression as _isMemberExpression,
} from "@babel/types";
const { filter } = require("fuzzaldrin-plus");

type ObjectPreviewProperty = {
  value: ValueFront;
  writable: boolean;
  configurable: boolean;
  enumerable: boolean;
  name: string;
  get?: any;
  set?: any;
};

type ObjectPreview = {
  containerEntries: any[];
  getterValues: any[];
  properties: ObjectPreviewProperty[];
  prototypeId: any;
  prototypeValue: ValueFront;
};

type ObjectFront = {
  className: string;
  objectId: string;
  preview?: ObjectPreview;
};

type ValueFront = {
  _pause: any;
  _hasPrimitive: false;
  _primitive?: boolean;
  _isBigInt: boolean;
  _isSymbol: boolean;
  _object: ObjectFront;
  _uninitialized: boolean;
  _unavailable: boolean;
  _elements: null;
  _isMapEntry: null;
};

type Binding = {
  name: string;
  value: ValueFront;
};

type Scope = {
  bindings: Binding[];
  actor: string;
  parent: Scope;
  functionName?: string;
  object?: ValueFront;
  scopeKind: string;
  type: "block" | string;
};

// This is used as a property name placeholder for what they user could
//  be trying to type or find the autocomplete match to.
const PROPERTY_PLACEHOLDER = "fakeProperty";

// Trims quotation marks from the string. This allows us to match
// bracket notation properties regardless of whether the user has quotation
// marks or not. i.e., `foo["ba` vs `foo[ba` will both show "bar" as
// an autocomplete match.
function normalizeString(str: string) {
  return str.toLowerCase().replace(/['"`]+/g, "");
}
function fuzzyFilter(candidates: string[], query: string): string[] {
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

// This tries to fill the rest of the input as if it were using bracket notation.
// If the isMemberExpression() call throws, or returns false, then we know it's
// not bracket notation.
function isBracketNotation(input: string) {
  const expressionUpToLastOpenBracket = input.slice(0, input.lastIndexOf("[") + 1);
  return isMemberExpression(expressionUpToLastOpenBracket + `"${PROPERTY_PLACEHOLDER}"]`);
}
// This tries to fill the rest of the input as if it were using dot notation.
// If the isMemberExpression() call throws, or returns false, then we know it's
// bracket notation.
function isDotNotation(input: string) {
  return isMemberExpression(input + PROPERTY_PLACEHOLDER);
}
function isAccessingObjProperty(input: string) {
  return isBracketNotation(input) || isDotNotation(input);
}

function getPropertiesForObject(object?: ObjectFront): string[] {
  const properties = [];

  if (!object) {
    return [];
  }

  // The object preview may be undefined until the user expands the object
  // in the scopes panel. This applies primarily to prototype objects.
  if (object.preview) {
    const objectProperties = object.preview.properties.map(b => b.name);
    properties.unshift(...objectProperties);
  } else {
    if (["Object", "Array"].includes(object.className)) {
      const prototypeProperties = Object.getOwnPropertyNames(Object.prototype);
      properties.unshift(...prototypeProperties);
    }

    if (object.className === "Array") {
      const prototypeProperties = Object.getOwnPropertyNames(Array.prototype);
      properties.unshift(...prototypeProperties);
    }
  }

  const prototype = object.preview?.prototypeValue;

  // Recursively gather the properties through the prototype chain.
  if (prototype?._object) {
    const prototypeProperties = getPropertiesForObject(prototype._object);
    properties.unshift(...prototypeProperties);
  }

  return properties;
}

export function getParentExpression(input: string) {
  if (isBracketNotation(input)) {
    return input.slice(0, input.lastIndexOf("["));
  } else {
    return input.slice(0, input.lastIndexOf("."));
  }
}

export function shouldPropertyAutocomplete(input: string) {
  if (!isAccessingObjProperty(input)) {
    return false;
  }

  const parentExpression = getParentExpression(input);

  if (!parentExpression) {
    return false;
  }

  // Right now, this only works for direct property access (e.g., a.b)
  // and doesn't support chained expressions (e.g., a.b.c.d). This is because
  // we don't (yet) immediately have the chained values in the fetched frame
  // scope data.
  return isIdentifier(parentExpression);
}
function shouldVariableAutocomplete(input: string) {
  return isIdentifier(input);
}

function getBinding(name: string, scope: Scope) {
  return scope.bindings.find(b => b.name === name);
}
function getBindingNames(scope: Scope): string[] {
  return scope.bindings.map(b => b.name);
}
function getGlobalVariables(scopes: Scope) {
  return getPropertiesForObject(scopes.parent.object?._object);
}

export function getLastToken(input: string) {
  if (isBracketNotation(input)) {
    return input.slice(input.lastIndexOf("[") + 1);
  } else {
    return input.slice(input.lastIndexOf(".") + 1);
  }
}

// Used to figure out the earliest cursor position of the current autocomplete target.
export function getCursorIndex(value: string) {
  if (shouldPropertyAutocomplete(value)) {
    // +1 to account for the `.` or `[`
    return getParentExpression(value).length + 1;
  } else {
    return 0;
  }
}

export function insertAutocompleteMatch(value: string, match: string) {
  const parentExpression = getParentExpression(value);

  if (shouldPropertyAutocomplete(value)) {
    if (isBracketNotation(value)) {
      return `${parentExpression}[${match}]`;
    } else {
      return `${parentExpression}.${match}`;
    }
  } else {
    // For variable autocomplete.
    return match;
  }
}

export function getAutocompleteMatches(input: string, scope: Scope) {
  if (shouldPropertyAutocomplete(input)) {
    const computedProperty = isBracketNotation(input);
    const lastToken = getLastToken(input);
    const parentToken = getParentExpression(input);

    const binding = getBinding(parentToken, scope);

    if (!binding) {
      return [];
    }

    const object = binding.value._object;

    if (!object) {
      return [];
    }

    const properties = getPropertiesForObject(object);

    const filteredProperties = fuzzyFilter(properties, normalizeString(lastToken));
    return filteredProperties.map(p => (computedProperty ? `"${p}"` : p));
  } else if (shouldVariableAutocomplete(input)) {
    const variableNames = [...getBindingNames(scope), ...getGlobalVariables(scope)];
    return fuzzyFilter(variableNames, normalizeString(input));
  }

  return [];
}
