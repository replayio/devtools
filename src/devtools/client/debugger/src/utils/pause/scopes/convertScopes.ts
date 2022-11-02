import { Frame, NamedValue, ObjectId, PauseId, Scope } from "@replayio/protocol";

import { getCachedObject } from "bvaughn-architecture-demo/src/suspense/ObjectPreviews";
import { assert } from "protocol/utils";

import { simplifyDisplayName } from "../frames";

export interface ConvertedBindingsScope {
  type: "bindings";
  title?: string;
  bindings: NamedValue[];
}

export interface ConvertedObjectScope {
  type: "object";
  title?: string;
  objectId: ObjectId;
}

export type ConvertedScope = ConvertedBindingsScope | ConvertedObjectScope;

export function convertScopes(scopes: Scope[], frame: Frame, pauseId: PauseId): ConvertedScope[] {
  const convertedScopes: ConvertedScope[] = [];
  for (let i = 0; i < scopes.length; i++) {
    const scope = scopes[i];
    const convertedScope = convertScope(scope, frame, i === 0, pauseId);
    if (!convertedScope) {
      continue;
    }
    const prevScope = i > 0 ? scopes[i - 1] : undefined;
    if (prevScope?.functionLexical && scope.type === "function") {
      assert(
        convertedScope.type === "bindings",
        "converted function scope must be of bindings type"
      );
      const prevConvertedScope = convertedScopes.pop()!;
      assert(
        prevConvertedScope.type === "bindings",
        "converted functionLexical scope must be of bindings type"
      );
      convertedScope.bindings.push(...prevConvertedScope.bindings);
      convertedScope.bindings.sort((a, b) => a.name!.localeCompare(b.name!));
    }
    convertedScopes.push(convertedScope);
  }

  return convertedScopes.filter(scope => scope.type !== "bindings" || scope.bindings.length);
}

function convertScope(
  scope: Scope,
  frame: Frame,
  addThis: boolean,
  pauseId: PauseId
): ConvertedScope {
  if (scope.bindings) {
    const bindings = scope.bindings ? [...scope.bindings] : [];
    if (addThis && frame.this) {
      bindings.push({ ...frame.this, name: "<this>" });
    }
    bindings.sort((a, b) => a.name!.localeCompare(b.name!));
    return {
      type: "bindings",
      title: getScopeTitle(scope),
      bindings,
    };
  } else {
    assert(scope.object, `a scope without bindings must have an object`);
    return {
      type: "object",
      title: getCachedObject(pauseId, scope.object)?.className,
      objectId: scope.object,
    };
  }
}

function getScopeTitle(scope: Scope) {
  if (scope.type === "function") {
    const name = scope.functionName;
    if (name) {
      return simplifyDisplayName(name);
    } else {
      return "<anonymous>";
    }
  }
  return "Block";
}
