import { findIndexString, insertString } from "@bvaughn/src/utils/array";
import { Property, Scope } from "@replayio/protocol";

// const OBJECT_PROTOTYPE_PROPERTIES = Object.getOwnPropertyNames(Object.prototype);
// const ARRAY_PROTOTYPE_PROPERTIES = Object.getOwnPropertyNames(Array.prototype);

export default function find(
  expressionHead: string | null,
  expressionTail: string | null,
  scopes: Scope[] | null,
  properties: Property[] | null
) {
  if (expressionHead) {
    // We're searching the properties of an object.
    // Ignore scope values because they aren't part of that object.
    if (expressionTail) {
      return findMatches(expressionTail.toLowerCase(), scopes, null);
    } else {
      // Show all properties until a user has started narrowing things down.
      return flatten(scopes, properties);
    }
  } else if (expressionTail) {
    // If there's no expression head, we might be searching values in scope,
    // or we might be searching global/window properties.
    return findMatches(expressionTail.toLowerCase(), scopes, properties);
  } else {
    return null;
  }
}

function flatten(scopes: Scope[] | null, properties: Property[] | null): string[] {
  const matches: string[] = [];

  if (scopes) {
    scopes.forEach(scope => {
      scope.bindings?.forEach(binding => {
        const name = binding.name.toLowerCase();
        if (findIndexString(matches, name) < 0) {
          insertString(matches, binding.name);
        }
      });
    });
  }

  if (properties) {
    properties.forEach(property => {
      const name = property.name.toLowerCase();
      if (findIndexString(matches, name) < 0) {
        insertString(matches, property.name);
      }
    });
  } else {
    // TODO
    // Under which conditions should we fall back to this?
    // [ARRAY_PROTOTYPE_PROPERTIES, OBJECT_PROTOTYPE_PROPERTIES].forEach(properties => {
    //   properties.forEach(property => {
    //     const name = property.toLowerCase();
    //     if (findIndexString(matches, name) < 0) {
    //       insertString(matches, property);
    //     }
    //   });
    // });
  }

  return matches;
}

function findMatches(
  needle: string,
  scopes: Scope[] | null,
  properties: Property[] | null
): string[] {
  const matches: string[] = [];

  if (scopes) {
    scopes.forEach(scope => {
      scope.bindings?.forEach(binding => {
        const name = binding.name.toLowerCase();
        if (findIndexString(matches, name) < 0 && name.startsWith(needle)) {
          insertString(matches, binding.name);
        }
      });
    });
  }

  if (properties) {
    properties.forEach(property => {
      const name = property.name.toLowerCase();
      if (findIndexString(matches, name) < 0 && name.startsWith(needle)) {
        insertString(matches, property.name);
      }
    });
  } else {
    // TODO
    // Under which conditions should we fall back to this?
    // [ARRAY_PROTOTYPE_PROPERTIES, OBJECT_PROTOTYPE_PROPERTIES].forEach(properties => {
    //   properties.forEach(property => {
    //     const name = property.toLowerCase();
    //     if (findIndexString(matches, name) < 0 && name.startsWith(needle)) {
    //       insertString(matches, property);
    //     }
    //   });
    // });
  }

  return matches;
}
