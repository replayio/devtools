import { Pause, ValueFront } from "protocol/thread";
import { features } from "ui/utils/prefs";

import { MODE } from "../../reps/constants";

import type { ValueItem } from "./index";
import type { Item } from "./index";

const {
  REPS: { Rep, Grip },
} = require("../../reps/rep");

/**
 * We show getters that are defined on the inspected object itself as well as
 * those defined on its prototype chain. GETTERS_FROM_PROTOTYPES defines how many
 * levels we should walk down the prototype chain looking for getters.
 */
export const GETTERS_FROM_PROTOTYPES = 1;

export function isValueLoaded(value: ValueFront): boolean {
  return value.isPrimitive() || !value.hasPreviewOverflow();
}

/**
 * Ensure the ValueFront is ready to be displayed in the ObjectInspector
 */
export async function loadValue(value: ValueFront) {
  await value.loadIfNecessary();
  if (features.originalClassNames) {
    await value.mapClassName();
  }
}

export function shouldRenderRootsInReps(roots: Item[]): boolean {
  if (roots.length !== 1) {
    return false;
  }

  const root = roots[0];
  const name = root && root.name;
  return (
    (name === null || typeof name === "undefined") &&
    (root.isPrimitive() || (root.type === "value" && root.isError()))
  );
}

export function renderRep(item: ValueItem, props: any) {
  return Rep({
    ...props,
    object: item.contents,
    mode: props.mode || MODE.TINY,
    defaultRep: Grip,
  });
}

export function documentHasSelection(doc = document): boolean {
  const selection = doc.defaultView?.getSelection();
  if (!selection) {
    return false;
  }

  return selection.type === "Range";
}

export function findPause(items: Item[]): Pause | null {
  for (const item of items) {
    if (item.type === "value") {
      return item.contents.getPause();
    }
    if (item.type === "container") {
      const childPause = findPause(item.contents);
      if (childPause) {
        return childPause;
      }
    }
  }
  return null;
}

export function getChildValues(parentValue: ValueFront): ValueFront[] {
  const previewValues = parentValue.previewValueMap();
  const rv = [...previewValues.values()];

  const knownProperties = new Set(previewValues.keys());
  parentValue.traversePrototypeChain(current => {
    rv.push(current);
    const getters = current.previewGetters();
    for (const [name, getterFn] of getters.entries()) {
      if (!knownProperties.has(name)) {
        rv.push(getterFn);
        knownProperties.add(name);
      }
    }
  }, GETTERS_FROM_PROTOTYPES);

  if (parentValue.className() === "Promise") {
    const result = parentValue.previewPromiseState();
    if (result) {
      const { state, value } = result;
      if (value) {
        rv.push(value);
      }
      rv.push(state);
    }
  }

  if (parentValue.className() === "Proxy") {
    const result = parentValue.previewProxyState();
    if (result) {
      const { target, handler } = result;
      rv.push(handler);
      rv.push(target);
    }
  } else {
    const prototypeValue = parentValue.previewPrototypeValue();
    if (prototypeValue) {
      rv.push(prototypeValue);
    }
  }

  return rv;
}
