import { ValueItem } from "./value";
import { KeyValueItem } from "./keyValue";
import { MODE } from "../../reps/constants";
import { LoadingItem } from "./loading";
import { ContainerItem } from "./container";
import { GetterItem } from "./getter";
import { Pause } from "protocol/thread";
import { ObjectInspectorItemProps } from "../components/ObjectInspectorItem";
const {
  REPS: { Rep, Grip },
} = require("../../reps/rep");

/**
 * We show getters that are defined on the inspected object itself as well as
 * those defined on its prototype chain. GETTERS_FROM_PROTOTYPES defines how many
 * levels we should walk down the prototype chain looking for getters.
 */
export const GETTERS_FROM_PROTOTYPES = 1;

export interface LabelAndValue {
  label?: React.ReactNode;
  value?: React.ReactNode;
}

export interface IItem {
  readonly type: string;
  name: string | undefined;
  path: string;
  isPrimitive(): boolean;
  getLabelAndValue(props: ObjectInspectorItemProps): LabelAndValue;
  getChildren(): Item[];
}

// An Item represents one node in the ObjectInspector tree:
// ValueItems represent nodes that correspond to a ValueFront (i.e. a javascript value in the debuggee)
// KeyValueItems represent nodes for entries in a native javascript container (i.e. Map, WeakMap, Set and WeakSet)
// ContainerItems represent nodes with an arbitrary list of child nodes
// - this is used to represent Scopes and the <entries> node of a native javascript container, for example
// GetterItems represent nodes for getters
// LoadingItem represents the "Loading…" node shown while a node's children are being loaded
export { ValueItem, KeyValueItem, ContainerItem, GetterItem, LoadingItem };
export type Item = ValueItem | KeyValueItem | ContainerItem | GetterItem | LoadingItem;

export async function loadChildren(root: Item): Promise<Item[]> {
  if (root.type === "value") {
    await root.contents.traversePrototypeChainAsync(
      async current => await current.loadIfNecessary(),
      GETTERS_FROM_PROTOTYPES
    );
  }
  const children = root.getChildren();
  await Promise.all(
    children.map(async child => {
      if (child.type === "value") {
        await child.contents.loadIfNecessary();
      }
    })
  );
  return children;
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
