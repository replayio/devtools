import { promises as fs } from "fs";
import { parentPort } from "worker_threads";
// Original source: https://github.com/bgotink/playwright-coverage
import { ProcessCov, ScriptCov, mergeProcessCovs } from "@bcoe/v8-coverage";
import type { SourceMapInput } from "@jridgewell/trace-mapping";
import { expose } from "comlink";
import nodeEndpoint from "comlink/dist/umd/node-adapter";

import { convertToIstanbulCoverage, getSourceMap } from "./data";

if (parentPort == null) {
  throw new Error("This script is meant to run as worker thread");
}

type ScriptCovWithSource = ScriptCov & {
  source?: string;
};

class CoverageWorker {
  /**
   * Invariant: if #queue.length > 0, conversion is active
   */
  #queue: string[] = [];

  #sources = new Map<string, string>();
  #sourceMaps = new Map<string, Promise<SourceMapInput | undefined>>();

  #totalCoverage: ProcessCov = { result: [] };

  #markReady?: () => void;

  constructor() {
    parentPort?.postMessage("Coverage worker created");
  }

  startConversion(path: string) {
    this.#queue.push(path);

    if (this.#queue.length === 1) {
      this.#convert();
    }
  }

  reset() {
    this.#queue.length = 0;
    this.#sources.clear();
    this.#totalCoverage = { result: [] };
  }

  async #convert() {
    if (this.#queue.length === 0) {
      this.#markReady?.();
      return;
    }

    await macrotick(); // wait one tick to give the event loop some space to run

    const [file] = this.#queue as [string, ...string[]];

    parentPort?.postMessage("Processing coverage file: " + file);
    const coverage: unknown = JSON.parse(await fs.readFile(file, "utf-8"));

    const isValidCoverage = isScriptCovArray(coverage);

    if (isValidCoverage) {
      for (const script of coverage) {
        if (typeof script.source === "string") {
          if (this.#sources.get(script.url) !== script.source) {
            this.#sources.set(script.url, script.source);
            this.#sourceMaps.set(script.url, getSourceMap(script.url, script.source));
          }

          delete script.source;
        }
      }

      parentPort?.postMessage(`Merging file: ${file}`);
      this.#totalCoverage = mergeProcessCovs([this.#totalCoverage, { result: coverage }]);
      parentPort?.postMessage(`Finished merging file: ${file}`);
    }

    this.#queue.shift();
    this.#convert();
  }

  async getTotalCoverage(sourceRoot: string, exclude: readonly string[]) {
    if (this.#queue.length !== 0) {
      // We're still running
      await new Promise<void>(resolve => (this.#markReady = resolve));
    }

    const sourceMaps = new Map(
      await Promise.all(
        Array.from(this.#sourceMaps, ([url, promise]) =>
          promise.then(map => {
            return [url, map] as const;
          })
        )
      )
    );

    parentPort?.postMessage(`Finished merging coverage, converting to Istanbul...`);
    let coverageMap: any = {};
    try {
      coverageMap = await convertToIstanbulCoverage(
        this.#totalCoverage,
        this.#sources,
        sourceMaps,
        exclude,
        sourceRoot
      );
    } catch (err) {
      parentPort?.postMessage(`Error merging: ` + err);
    }

    parentPort?.postMessage(`Conversion complete`);
    return JSON.stringify(coverageMap);
  }

  async doSomethingUseful() {
    return { value: 42 };
  }
}

export type { CoverageWorker };

expose(new CoverageWorker(), nodeEndpoint(parentPort));

function isScriptCovArray(obj: unknown): obj is ScriptCovWithSource[] {
  return (
    typeof obj === "object" &&
    obj != null &&
    Array.isArray(obj) &&
    obj.every(item => "scriptId" in (item as any))
  );
}

function macrotick() {
  return new Promise(resolve => setTimeout(resolve));
}

process.on("uncaughtException", err => {
  parentPort?.postMessage("Uncaught error in the worker: " + err);
  process.exit(1); // mandatory (as per the Node.js docs)
});
