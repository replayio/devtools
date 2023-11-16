import util from "util";
import groupBy from "lodash/groupBy";

import type { RecordingTestMetadataV3, TestEvent } from "../RecordingTestMetadata";
import { groupTestStepsByCallStack, isFunctionTestEvent } from "../RecordingTestMetadata";

const playwrightSteps: RecordingTestMetadataV3.TestEvent[] = require("./playwrightSteps.fixture.json");

export function inspectDeep(value: any, depth = 25) {
  return util.inspect(value, {
    depth,
    colors: true,
    maxArrayLength: null,
    maxStringLength: Infinity,
    breakLength: 120,
  });
}

describe("groupTestStepsByCallStack", () => {
  test("groups steps by call stack", () => {
    const firstSteps = playwrightSteps.slice(0, 25);
    const groupedSteps = groupTestStepsByCallStack(firstSteps);
    console.log("Grouped test events: ", inspectDeep(groupedSteps));
    //  console.log("Grouped steps: ", inspectDeep(groupedSteps));
    // const strings: string[] = [];

    const entriesWithStacks: EntryWithStack[] = firstSteps.map(step => {
      const stack = "testSourceCallStack" in step.data ? step.data.testSourceCallStack ?? [] : [];
      stack.reverse();
      return {
        event: step,
        stack,
      };
    });

    // console.log(inspectDeep(entriesWithStacks, 4));

    const groupedSteps2 = recursiveGroupByStack(entriesWithStacks);
    // console.log("Grouped steps2: ", inspectDeep(groupedSteps2));

    // const initialGroupedSteps = groupBy(firstSteps, step => {
    //   return getEntryKey(step);
    // });

    // console.log("Initial grouped steps: ", inspectDeep(initialGroupedSteps));

    // for (const step of firstSteps) {
    //   if ("testSourceCallStack" in step.data) {
    //     const testSourceCallStack = step.data.testSourceCallStack ?? [];
    //     if (testSourceCallStack.length > 0) {
    //       const [lastEntry] = testSourceCallStack.slice().reverse().slice(-1);
    //       const { fileName, functionName, lineNumber, columnNumber } = lastEntry;
    //       const key = `${fileName}:${functionName}:${lineNumber}:${columnNumber}`;
    //       const numSteps = testSourceCallStack.length;
    //       const paddedText = key.padStart(key.length + numSteps * 2, " ");
    //       // console.log(paddedText);
    //       strings.push(paddedText);
    //     }
    //   }
    // }

    // console.log("Output: \n", strings.join("\n"));
  });
});

interface EntryWithStack {
  event: RecordingTestMetadataV3.TestEvent;
  stack: RecordingTestMetadataV3.UserActionStackEntry[];
}

const getStack = (step: RecordingTestMetadataV3.TestEvent) => {
  const stack = "testSourceCallStack" in step.data ? step.data.testSourceCallStack ?? [] : [];
  return stack;
};

const getEntryKey = (step: RecordingTestMetadataV3.TestEvent): string => {
  const stack = getStack(step);
  const [nextFrame, ...remainingFrames] = stack;
  const key = nextFrame
    ? `${nextFrame.fileName}:${nextFrame.functionName}:${nextFrame.lineNumber}`
    : "";
  return key;
};

export function recursiveGroupByStack(data: EntryWithStack[]) {
  const obj: Record<string, EntryWithStack[]> = {} as any;

  // if (groupers.length === 0) {
  //   if (leafItemTransformer) {
  //     if (leafItemTransformer instanceof Function) {
  //       return leafItemTransformer(data);
  //     } else {
  //       return data.map(x => x[leafItemTransformer]);
  //     }
  //   }

  //   return data;
  // }

  // const grouper = groupers[0];

  for (const item of data) {
    // const value: V = item[grouper] as V;
    const [nextFrame, ...remainingFrames] = item.stack;
    const key = nextFrame
      ? `${nextFrame.fileName}:${nextFrame.functionName}:${nextFrame.lineNumber}`
      : "";

    if (!obj[key]) {
      obj[key] = [];
    }

    obj[key].push({
      event: item.event,
      stack: remainingFrames,
    });
  }

  type GroupedObj = Record<string, Record<string, EntryWithStack[]>>; // TODO if last grouper, then only 1-level deep record.
  const groupedObj: GroupedObj = {} as GroupedObj; // TODO TS

  // const nextGroupers: K[] = groupers.slice(1);

  for (const [group, subvalues] of Object.entries(obj)) {
    // const group = entry[0] as V; // TODO TS - should infer automatically.
    // const subvalues: T[] = entry[1] as T[]; // TODO TS - should infer automatically.
    const subvaluesWithRemainingStacks = subvalues.filter(x => x.stack.length > 0);

    const subgrouped = recursiveGroupByStack(subvaluesWithRemainingStacks);
    groupedObj[group] = subgrouped as any; // TODO TS FIXME
  }

  return groupedObj;
}

export function recursiveGroupByOriginal<
  T,
  K extends keyof T,
  V extends T[K] & (string | number | symbol),
  U = unknown
>(data: T[], groupers: K[], leafItemTransformer?: K | ((leafs: T[]) => U)) {
  const obj: Record<V, T[]> = {} as any;

  if (groupers.length === 0) {
    if (leafItemTransformer) {
      if (leafItemTransformer instanceof Function) {
        return leafItemTransformer(data);
      } else {
        return data.map(x => x[leafItemTransformer]);
      }
    }

    return data;
  }

  const grouper = groupers[0];

  for (const item of data) {
    const value: V = item[grouper] as V;

    if (!obj[value]) {
      obj[value] = [];
    }

    obj[value].push(item);
  }

  type GroupedObj = Record<V, Record<V, T[]>>; // TODO if last grouper, then only 1-level deep record.
  const groupedObj: GroupedObj = {} as GroupedObj; // TODO TS

  const nextGroupers: K[] = groupers.slice(1);

  for (const entry of Object.entries(obj)) {
    const group: V = entry[0] as V; // TODO TS - should infer automatically.
    const subvalues: T[] = entry[1] as T[]; // TODO TS - should infer automatically.

    const subgrouped = recursiveGroupByOriginal(subvalues, nextGroupers, leafItemTransformer);
    groupedObj[group] = subgrouped as any; // TODO TS FIXME
  }

  return groupedObj;
}
