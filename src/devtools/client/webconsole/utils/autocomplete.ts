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
type Scopes = {
  scope: Scope;
  pending: boolean;
  originalScopesUnavailable: boolean;
};

export function getBindingNames(scopes: Scopes): string[] {
  if (!scopes?.scope) {
    return [];
  }

  return scopes.scope.bindings.map(b => b.name);
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
  if (prototype) {
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

export function shouldVariableAutocomplete(input: string) {
  return !input.includes(".");
}
export function getBinding(name: string, scopes: Scopes) {
  return scopes.scope.bindings.find(b => b.name === name);
}
