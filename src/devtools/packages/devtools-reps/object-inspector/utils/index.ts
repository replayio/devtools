/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { ValueItem } from "./value";
import { KeyValueItem } from "./keyValue";
import { MODE } from "../../reps/constants";
import { LoadingItem } from "./loading";
import { ContainerItem } from "./container";
import { Pause } from "protocol/thread";
import { ObjectInspectorItemProps } from "../components/ObjectInspectorItem";

const {
  REPS: { Rep, Grip },
} = require("../../reps/rep");

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
// KeValueItems represent nodes for entries in a native javascript container (i.e. Map, WeakMap, Set and WeakSet)
// ContainerItems represent nodes with an arbitrary list of child nodes
// - this is used to represent Scopes and the <entries> node of a native javascript container, for example
// LoadingItem represents the "Loading…" node shown while a node's children are being loaded
export { ValueItem, KeyValueItem, ContainerItem, LoadingItem };
export type Item = ValueItem | KeyValueItem | ContainerItem | LoadingItem;

export async function loadChildren(root: Item): Promise<Item[]> {
  if (root.type === "value") {
    if (root.needsToLoad()) {
      await root.contents.load();
    }
  }
  const children = root.getChildren();
  await Promise.all(
    children.map(async child => {
      if (child.type === "value" && child.needsToLoad()) {
        await child.contents.load();
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
