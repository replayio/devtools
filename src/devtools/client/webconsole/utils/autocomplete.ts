import { parseExpression } from "@babel/parser";
import {
  isIdentifier as _isIdentifier,
  isMemberExpression as _isMemberExpression,
  isStringLiteral as _isStringLiteral,
  StringLiteral,
  Identifier,
} from "@babel/types";
import generate from "@babel/generator";
import { ThreadFront } from "protocol/thread";
import Error from "next/error";
import { createConsoleLogger } from "launchdarkly-js-client-sdk";
const { filter } = require("fuzzaldrin-plus");

type PropertyExpression = {
  left: string;
  right: string;
  computed: boolean;
};

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
export function getCursorIndex(value: string) {
  const propertyExpression = getPropertyExpression(value);

  if (propertyExpression) {
    // +1 to account for the `.` or `[`
    return propertyExpression.left.length + 1;
  } else {
    return 0;
  }
}
export function insertAutocompleteMatch(value: string, match: string) {
  const propertyExpression = getPropertyExpression(value);

  if (propertyExpression) {
    const { left, computed } = propertyExpression;

    if (computed) {
      return `${left}["${match}"]`;
    } else {
      return `${left}.${match}`;
    }
  } else {
    // For variable autocomplete.
    return match;
  }
}
export function getAutocompleteMatches(input: string, scope: Scope) {
  const propertyExpression = getPropertyExpression(input);

  if (propertyExpression) {
    const properties = [];
    const { left, right } = propertyExpression;

    const object = getBinding(left, scope)?.value._object;
    if (object) {
      properties.push(...getPropertiesForObject(object));
    }

    return fuzzyFilter(properties, normalizeString(right));
  } else if (shouldVariableAutocomplete(input)) {
    const variableNames = [...getBindingNames(scope), ...getGlobalVariables(scope)];
    return fuzzyFilter(variableNames, normalizeString(input));
  }

  return [];
}
// export async function getAutocompleteMatches(input: string, scope: Scope) {
//   const propertyExpression = getPropertyExpression(input);

//   if (propertyExpression) {
//     const properties = [];
//     const { left, right } = propertyExpression;

//     const object = getBinding(left, scope)?.value._object;
//     if (object) {
//       properties.push(...getPropertiesForObject(object));
//     }

//     console.log("1");

//     const evaluatedProperties = await getEvaluatedProperties(left);

//     return fuzzyFilter([...evaluatedProperties], normalizeString(right));
//   } else if (shouldVariableAutocomplete(input)) {
//     const variableNames = [...getBindingNames(scope), ...getGlobalVariables(scope)];
//     return fuzzyFilter(variableNames, normalizeString(input));
//   }

//   return [];
// }

// Use eager eval to get the properties of the last complete object in the expression.
async function getEvaluatedProperties(expression: string): Promise<string[]> {
  const { asyncIndex, frameId } = gToolbox.getPanel("debugger")!.getFrameId();
  let properties: string[] = [];

  try {
    const { returned, exception, failed } = await ThreadFront.evaluate(
      asyncIndex,
      frameId,
      expression,
      true
    );
    if (returned && !(failed || exception)) {
      const evaluatedProperties = getPropertiesForObject(returned._object);
      console.log({ evaluatedProperties });
      properties.push(...evaluatedProperties);
    }
  } catch (err: any) {
    let msg = "Error: Eager Evaluation failed";
    if (err.message) {
      msg += ` - ${err.message}`;
    }
    console.error(msg);
  }

  return properties;
}
