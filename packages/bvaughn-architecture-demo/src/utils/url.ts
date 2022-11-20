import { newSource as ProtocolSource } from "@replayio/protocol";
import memoize from "lodash/memoize";

import { isIndexedSource } from "../suspense/SourcesCache";

interface ParsedURL {
  hash: string;
  host: string;
  hostname: string;
  href: string;
  origin: string;
  password: string;
  path: string;
  pathname: string;
  port: string;
  protocol: string;
  search: string;
  // This should be a "URLSearchParams" object
  searchParams: Record<string, string>;
  username: string;
}

const DEFAULT_ULR: ParsedURL = {
  hash: "",
  host: "",
  hostname: "",
  href: "",
  origin: "null",
  password: "",
  path: "",
  pathname: "",
  port: "",
  protocol: "",
  search: "",
  // This should be a "URLSearchParams" object
  searchParams: {},
  username: "",
};

export function getRelativePath(url: string) {
  const { pathname } = parseUrlMemoized(url);
  if (!pathname) {
    return url;
  }
  const index = pathname.indexOf("/");

  return index !== -1 ? pathname.slice(index + 1) : "";
}

export function getRelativePathWithoutFile(url: string) {
  const path = getRelativePath(url);
  return path.slice(0, path.lastIndexOf("/"));
}

export const parseUrlMemoized = memoize(function parseUrl(url): ParsedURL {
  try {
    if (url.startsWith("webpack://_N_E")) {
      url = `webpack:${url.substring(14)}`;
    } else if (url.startsWith("webpack-internal:///.")) {
      url = `webpack-internal:${url.substring(21)}`;
    }
    const urlObj = new URL(url) as unknown as ParsedURL;
    urlObj.path = urlObj.pathname + urlObj.search;
    return urlObj;
  } catch (err) {
    // If we're given simply a filename...
    if (url) {
      return { ...DEFAULT_ULR, path: url, pathname: url };
    }

    return DEFAULT_ULR;
  }
});
