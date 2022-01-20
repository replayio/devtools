import * as babelParser from "@babel/parser";
import * as t from "@babel/types";

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
type FrameScope = {
  scope: Scope;
  pending: boolean;
  originalScopesUnavailable: boolean;
};

export function getBindingNames(scope: FrameScope): string[] {
  if (!scope?.scope) {
    return [];
  }

  return scope.scope.bindings.map(b => b.name);
}

export function getPropertiesForObject(object: ObjectFront): string[] {
  const preview = object.preview;
  const properties = [];

  // The object preview may be undefined until the user expands the object
  // in the scopes panel. This applies primarily to prototype objects.
  if (preview) {
    const objectProperties = preview.properties.map(b => b.name);
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

  const prototype = preview?.prototypeValue;

  // Recursively gather the properties through the prototype chain.
  if (prototype?._object) {
    const prototypeProperties = getPropertiesForObject(prototype._object);
    properties.unshift(...prototypeProperties);
  }

  return properties;
}
export function getGlobalVariables(scopes: Scope) {
  const variableNames = [];
  const globalObject = scopes.parent.object;

  if (globalObject) {
    const properties = getPropertiesForObject(globalObject._object);
    variableNames.push(...properties);
  }

  return variableNames;
}

export function getParentExpression(input: string) {
  if (isBracketNotation(input)) {
    return input.slice(0, input.lastIndexOf("["));
  } else {
    return input.slice(0, input.lastIndexOf("."));
  }
}

export function isIdentifier(expression: string) {
  try {
    const parsed = babelParser.parseExpression(expression);
    const isIdentifier = t.isIdentifier(parsed);

    return isIdentifier;
  } catch (e) {
    return false;
  }
}
export function isMemberExpression(expression: string) {
  try {
    const parsed = babelParser.parseExpression(expression);
    const rv = t.isMemberExpression(parsed);

    return rv;
  } catch (e) {
    return false;
  }
}
export function isBracketNotation(input: string) {
  const expression = input.slice(0, input.lastIndexOf("[") + 1);
  return isMemberExpression(expression + `"a"]`);
}
function isDotNotation(input: string) {
  return isMemberExpression(input + `a`);
}
export function isAccessingObjProperty(input: string) {
  return isBracketNotation(input) || isDotNotation(input);
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
  // we don't (yet) have the chained values in the fetched frame scope data.
  return isIdentifier(parentExpression);
}

export function shouldVariableAutocomplete(input: string) {
  return isIdentifier(input);
}

export function getBinding(name: string, frameScope: FrameScope) {
  return frameScope.scope.bindings.find(b => b.name === name);
}
export function getLastToken(input: string) {
  if (isBracketNotation(input)) {
    return input.slice(input.lastIndexOf("[") + 1);
  } else {
    return input.slice(input.lastIndexOf(".") + 1);
  }
}

function getMatchString(str: string) {
  return str.toLowerCase().replace(/['"`]+/g, "");
}

export function getAutocompleteMatches(input: string, frameScope: FrameScope) {
  if (!frameScope?.scope) {
    return [];
  }

  const bindingNames = getBindingNames(frameScope);

  if (shouldPropertyAutocomplete(input)) {
    const computedProperty = isBracketNotation(input);
    const lastToken = getLastToken(input);
    const parentToken = getParentExpression(input);

    const binding = getBinding(parentToken, frameScope);

    if (!binding) {
      return [];
    }

    const object = binding.value._object;

    if (!object) {
      return [];
    }

    const properties = getPropertiesForObject(object);
    const filteredProperties = properties.filter(p =>
      getMatchString(p).includes(getMatchString(lastToken))
    );

    return filteredProperties.map(p => (computedProperty ? `"${p}"` : p));
  } else if (shouldVariableAutocomplete(input)) {
    const variableNames = [...bindingNames, ...getGlobalVariables(frameScope.scope)];
    return variableNames.filter(name => name.toLowerCase().includes(input.toLowerCase()));
  }

  return [];
}

export function appendAutocompleteMatch(value: string, match: string) {
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
