/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file contains React utilities pulled from https://github.com/facebook/react/blob/5309f102854475030fb91ab732141411b49c1126/packages/react-devtools-shared/src/utils.js#L195
// We do not run this in production, but we do use it for testing the
// React routine locally so we keep it in the repo for that usecase.
// The operations format is the one of React DevTools 7.0+ (see
// react-devtools-shared/src/constants.js and devtools/store.js in React DevTools 8.0.0).

export const TREE_OPERATION_ADD = 1;
export const TREE_OPERATION_REMOVE = 2;
export const TREE_OPERATION_REORDER_CHILDREN = 3;
export const TREE_OPERATION_UPDATE_TREE_BASE_DURATION = 4;
export const TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS = 5;
// React DevTools 8.0 removed TREE_OPERATION_REMOVE_ROOT (6): a root is removed
// by a TREE_OPERATION_REMOVE of its ID, after all of its descendants.
export const TREE_OPERATION_SET_SUBTREE_MODE = 7;
export const SUSPENSE_TREE_OPERATION_ADD = 8;
export const SUSPENSE_TREE_OPERATION_REMOVE = 9;
export const SUSPENSE_TREE_OPERATION_REORDER_CHILDREN = 10;
export const SUSPENSE_TREE_OPERATION_RESIZE = 11;
export const SUSPENSE_TREE_OPERATION_SUSPENDERS = 12;
export const TREE_OPERATION_APPLIED_ACTIVITY_SLICE_CHANGE = 13;

export const ElementTypeClass = 1;
export const ElementTypeContext = 2;
export const ElementTypeFunction = 5;
export const ElementTypeForwardRef = 6;
export const ElementTypeHostComponent = 7;
export const ElementTypeMemo = 8;
export const ElementTypeOtherOrUnknown = 9;
export const ElementTypeProfiler = 10;
export const ElementTypeRoot = 11;
export const ElementTypeSuspense = 12;
export const ElementTypeSuspenseList = 13;
export const ElementTypeTracingMarker = 14;
export const ElementTypeVirtual = 15;
export const ElementTypeViewTransition = 16;
export const ElementTypeActivity = 17;

export const PROFILING_FLAG_BASIC_SUPPORT = 0b001;
export const PROFILING_FLAG_TIMELINE_SUPPORT = 0b010;
export const PROFILING_FLAG_PERFORMANCE_TRACKS_SUPPORT = 0b100;

const encodedStringCache: Map<string, number[]> = new Map();

export function utfDecodeString(array: Array<number>): string {
  // Avoid spreading the array (e.g. String.fromCodePoint(...array))
  // Functions arguments are first placed on the stack before the function is called
  // which throws a RangeError for large arrays.
  // See github.com/facebook/react/issues/22293
  let string = "";
  for (let i = 0; i < array.length; i++) {
    const char = array[i];
    string += String.fromCodePoint(char);
  }
  return string;
}

function surrogatePairToCodePoint(charCode1: number, charCode2: number): number {
  return ((charCode1 & 0x3ff) << 10) + (charCode2 & 0x3ff) + 0x10000;
}

// Credit for this encoding approach goes to Tim Down:
// https://stackoverflow.com/questions/4877326/how-can-i-tell-if-a-string-contains-multibyte-characters-in-javascript
export function utfEncodeString(string: string): Array<number> {
  const cached = encodedStringCache.get(string);
  if (cached !== undefined) {
    return cached;
  }

  const encoded = [];
  let i = 0;
  let charCode;
  while (i < string.length) {
    charCode = string.charCodeAt(i);
    // Handle multibyte unicode characters (like emoji).
    if ((charCode & 0xf800) === 0xd800) {
      encoded.push(surrogatePairToCodePoint(charCode, string.charCodeAt(++i)));
    } else {
      encoded.push(charCode);
    }
    ++i;
  }

  encodedStringCache.set(string, encoded);

  return encoded;
}

export function printOperationsArray(operations: Array<number>) {
  // The first two values are always rendererID and rootID
  const rendererID = operations[0];
  const rootID = operations[1];

  const logs = [`operations for renderer:${rendererID} and root:${rootID}`];

  let i = 2;

  // Reassemble the string table.
  const stringTable: string[] = [
    null as any, // ID = 0 corresponds to the null string.
  ];
  const stringTableSize = operations[i++];
  const stringTableEnd = i + stringTableSize;
  while (i < stringTableEnd) {
    const nextLength = operations[i++];
    const nextString = utfDecodeString(operations.slice(i, i + nextLength));
    stringTable.push(nextString);
    i += nextLength;
  }

  while (i < operations.length) {
    const operation = operations[i];

    switch (operation) {
      case TREE_OPERATION_ADD: {
        const id = operations[i + 1];
        const type = operations[i + 2];

        i += 3;

        if (type === ElementTypeRoot) {
          logs.push(`Add new root node ${id}`);

          i++; // isStrictModeCompliant
          i++; // profilingFlags
          i++; // supportsStrictMode
          i++; // hasOwnerMetadata
        } else {
          const parentID = operations[i];
          i++;

          i++; // ownerID

          const displayNameStringID = operations[i];
          const displayName = stringTable[displayNameStringID];
          i++;

          i++; // key
          i++; // name prop

          logs.push(`Add node ${id} (${displayName || "null"}) as child of ${parentID}`);
        }
        break;
      }
      case TREE_OPERATION_REMOVE: {
        const removeLength = operations[i + 1];
        i += 2;

        for (let removeIndex = 0; removeIndex < removeLength; removeIndex++) {
          const id = operations[i];
          i += 1;

          logs.push(`Remove node ${id}`);
        }
        break;
      }
      case TREE_OPERATION_SET_SUBTREE_MODE: {
        const id = operations[i + 1];
        const mode = operations[i + 2];

        i += 3;

        logs.push(`Mode ${mode} set for subtree with root ${id}`);
        break;
      }
      case TREE_OPERATION_REORDER_CHILDREN: {
        const id = operations[i + 1];
        const numChildren = operations[i + 2];
        i += 3;
        const children = operations.slice(i, i + numChildren);
        i += numChildren;

        logs.push(`Re-order node ${id} children ${children.join(",")}`);
        break;
      }
      case TREE_OPERATION_UPDATE_TREE_BASE_DURATION:
        // Base duration updates are only sent while profiling is in progress.
        // We can ignore them at this point.
        // The profiler UI uses them lazily in order to generate the tree.
        i += 3;
        break;
      case TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS: {
        const id = operations[i + 1];
        const numErrors = operations[i + 2];
        const numWarnings = operations[i + 3];

        i += 4;

        logs.push(`Node ${id} has ${numErrors} errors and ${numWarnings} warnings`);
        break;
      }
      case SUSPENSE_TREE_OPERATION_ADD: {
        const id = operations[i + 1];
        const parentID = operations[i + 2];
        const numRects = operations[i + 5];
        i += 6 + Math.max(numRects, 0) * 4;

        logs.push(`Add suspense node ${id} as child of ${parentID}`);
        break;
      }
      case SUSPENSE_TREE_OPERATION_REMOVE: {
        const removeLength = operations[i + 1];
        const ids = operations.slice(i + 2, i + 2 + removeLength);
        i += 2 + removeLength;

        logs.push(`Remove suspense nodes ${ids.join(",")}`);
        break;
      }
      case SUSPENSE_TREE_OPERATION_REORDER_CHILDREN: {
        const id = operations[i + 1];
        const numChildren = operations[i + 2];
        const children = operations.slice(i + 3, i + 3 + numChildren);
        i += 3 + numChildren;

        logs.push(`Re-order suspense node ${id} children ${children.join(",")}`);
        break;
      }
      case SUSPENSE_TREE_OPERATION_RESIZE: {
        const id = operations[i + 1];
        const numRects = operations[i + 2];
        i += 3 + Math.max(numRects, 0) * 4;

        logs.push(`Resize suspense node ${id}`);
        break;
      }
      case SUSPENSE_TREE_OPERATION_SUSPENDERS: {
        i++;
        const changeLength = operations[i++];
        for (let changeIndex = 0; changeIndex < changeLength; changeIndex++) {
          const id = operations[i];
          i += 4; // id, hasUniqueSuspenders, endTime, isSuspended
          const environmentNamesLength = operations[i++];
          i += environmentNamesLength;

          logs.push(`Suspenders changed for suspense node ${id}`);
        }
        break;
      }
      case TREE_OPERATION_APPLIED_ACTIVITY_SLICE_CHANGE: {
        const activitySliceID = operations[i + 1];
        i += 2;

        logs.push(`Applied activity slice ${activitySliceID}`);
        break;
      }
      default:
        throw Error(`Unsupported Bridge operation "${operation}"`);
    }
  }

  return logs.join("\n  ");
}
