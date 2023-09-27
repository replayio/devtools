import { promises as fs } from "fs";
import { posix } from "path";
import { URL, pathToFileURL } from "url";
// Original source: https://github.com/bgotink/playwright-coverage
import type { ProcessCov } from "@bcoe/v8-coverage";
import type { SourceMapInput } from "@jridgewell/trace-mapping";
import type { Suite, TestResult } from "@playwright/test/reporter";
import { createCoverageMap } from "istanbul-lib-coverage";
// @ts-ignore
import { isMatch } from "micromatch";
import v8ToIstanbul from "v8-to-istanbul";

export const attachmentName = "@bgotink/playwright-coverage";

export function collectV8CoverageFiles(suite: Suite) {
  const files = new Set<string>();

  for (const test of suite.allTests()) {
    for (const result of test.results) {
      const attachmentIndex = result.attachments.findIndex(({ name }) => name === attachmentName);

      if (attachmentIndex === -1) {
        continue;
      }

      const [attachment] = result.attachments.splice(attachmentIndex, 1) as [
        TestResult["attachments"][number]
      ];

      if (attachment.path != null) {
        files.add(attachment.path);
      }
    }
  }

  return files;
}

const fetch = eval('import("node-fetch")') as Promise<typeof import("node-fetch")>;

export async function getSourceMap(
  url: string,
  source: string
): Promise<SourceMapInput | undefined> {
  const match = source.match(/\/\/# *sourceMappingURL=(.*)$/);

  if (match == null) {
    return undefined;
  }

  const resolved = new URL(match[1]!, url);

  switch (resolved.protocol) {
    case "file:":
      return JSON.parse(await fs.readFile(resolved, "utf8")) as any;
    case "data:": {
      if (!/^application\/json[,;]/.test(resolved.pathname)) {
        return undefined;
      }

      const comma = resolved.pathname.indexOf(",");
      const rawData = resolved.pathname.slice(comma + 1);
      const between = resolved.pathname.slice("application/json;".length, comma).split(";");

      const dataString = between.includes("base64")
        ? Buffer.from(rawData, "base64url").toString("utf8")
        : rawData;

      return JSON.parse(dataString) as any;
    }
    default: {
      const response = await (
        await fetch
      ).default(resolved.href, {
        method: "GET",
      });

      return (await response.json()) as SourceMapInput;
    }
  }
}

export async function getSourceMaps(
  sources: ReadonlyMap<string, string>
): Promise<ReadonlyMap<string, SourceMapInput | undefined>> {
  return new Map<string, SourceMapInput | undefined>(
    await Promise.all(
      Array.from(sources, async ([url, source]) => [url, await getSourceMap(url, source)] as const)
    )
  );
}

export async function convertToIstanbulCoverage(
  v8Coverage: ProcessCov,
  sources: ReadonlyMap<string, string>,
  sourceMaps: ReadonlyMap<string, SourceMapInput | undefined>,
  exclude: readonly string[],
  sourceRoot: string
) {
  const istanbulCoverage = createCoverageMap({});

  for (const script of v8Coverage.result) {
    const source = sources.get(script.url);
    // TODO We're skipping out on using sourcemaps, actually - remove this?
    // const sourceMap = sourceMaps.get(script.url);

    if (source == null) {
      continue;
    }

    function sanitizePath(path: string) {
      let url;

      try {
        url = new URL(path);
      } catch {
        url = pathToFileURL(path);
      }

      let relativePath;
      if (url.protocol === "webpack:") {
        relativePath = url.pathname.slice(1); // webpack: URLs contain relative paths
      } else {
        relativePath = url.pathname;
      }

      if (relativePath.includes("/webpack:/")) {
        // v8ToIstanbul breaks when the source root in the source map is set to webpack:
        // It treats the URL as a path, leading to a confusing result.
        relativePath = relativePath.slice(relativePath.indexOf("/webpack:/") + "/webpack:/".length);
      } else if (posix.isAbsolute(relativePath)) {
        relativePath = posix.relative(pathToFileURL(sourceRoot).pathname, path);
      }

      return relativePath;
    }

    const isExcludedCache = new Map<string, boolean>();
    const convertor = v8ToIstanbul(
      "",
      0,
      {
        source,
        // TODO We're skipping out on using sourcemaps
        // sourceMap: { sourcemap: sourceMap },
      },
      path => {
        let isExcluded = isExcludedCache.get(path)!;

        if (isExcluded != null) {
          return isExcluded;
        }

        const relativePath = sanitizePath(path);

        isExcluded =
          // ignore files outside of the root
          relativePath.startsWith("../") ||
          // ignore webpack files
          path.includes("/webpack:/webpack/") ||
          relativePath === "webpack/bootstrap" ||
          relativePath.startsWith("webpack/runtime/") ||
          // ignore dependencies
          relativePath.startsWith("node_modules/") ||
          relativePath.includes("/node_modules/") ||
          // apply exclusions
          isMatch(relativePath, exclude);
        isExcludedCache.set(path, isExcluded!);

        return isExcluded;
      }
    );
    await convertor.load();

    convertor.applyCoverage(script.functions);
    const coverageMap = convertor.toIstanbul();

    const dataEntries = Array.from(Object.entries(coverageMap), ([path, coverage]) => {
      path = sanitizePath(path);
      return [
        path,
        {
          ...coverage,
          path,
        },
      ] as const;
    }).filter(([path]) => !!path);

    const finalCoverageMap = Object.fromEntries(dataEntries);
    const keys = Object.keys(finalCoverageMap);
    istanbulCoverage.merge(finalCoverageMap);
  }

  return istanbulCoverage;
}
