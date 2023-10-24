import { Property } from "@replayio/protocol";

import { UnknownFunction } from "ui/setup/dynamic/devtools";

export type ChunksArray = (UnknownFunction | string | number)[];

// This function must be included in the evaluated expression string.
// Either copy-paste it directly inside an evaluated TS-based function,
// or insert it into an outer template literal string so it's in scope.
export function splitStringIntoChunks(allChunks: ChunksArray, str: string) {
  // Split the stringified data into chunks
  const stringChunks: string[] = [];
  for (let i = 0; i < str.length; i += 9999) {
    stringChunks.push(str.slice(i, i + 9999));
  }

  // If there's more than one string chunk, save its size
  if (stringChunks.length > 1) {
    allChunks.push(stringChunks.length);
  }

  for (const chunk of stringChunks) {
    allChunks.push(chunk);
  }
  return stringChunks.length;
}

// The counterpart will run locally on the eval result data.
// NOTE: this mutates the `chunks` array!
export function deserializeChunkedString(chunks: Property[]): string {
  let numStringChunks = 1;
  if (typeof chunks[0].value === "number") {
    const numChunksProp = chunks.shift()!;
    numStringChunks = numChunksProp.value;
  }
  const stringChunks = chunks.splice(0, numStringChunks);

  let str = "";
  for (const stringChunkProp of stringChunks) {
    str += stringChunkProp.value;
  }

  return str;
}
