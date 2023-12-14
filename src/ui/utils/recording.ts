import { useRouter } from "next/router";
import slugify from "slugify";

import { Recording } from "shared/graphql/types";

import { usesWindow } from "../../ssr";
import { SLUG_SEPARATOR, extractIdAndSlug } from "./helpers";

const WARNING_MS = 60 * 2 * 1000;
export const showDurationWarning = (recording: Recording) =>
  !!recording.duration && recording.duration > WARNING_MS;

export function getRecordingURL(recording: Recording): string {
  let id = recording.id;
  if (recording.title) {
    id = slugify(recording.title, { strict: true }).toLowerCase() + SLUG_SEPARATOR + recording.id;
  }

  // Revert once we merge the test-suites branch into main (see SCS-1723)
  if (window.location.host === "tests.replay.io") {
    return `https://app.replay.io/recording/${id}`;
  }

  return `/recording/${id}`;
}

export function useGetRecordingURLForTest(recordingId: string): string {
  const { apiKey, e2e } = useRouter().query;
  const pathName = `/recording/${recordingId}?e2e=${e2e ?? ""}&apiKey=${apiKey ?? ""}`;
  // Revert once we merge the test-suites branch into main (see SCS-1723)
  const host = window.location.host === "tests.replay.io" ? "https://app.replay.io" : "";

  return host + pathName;
}

export function getRecordingId(): string | undefined {
  return usesWindow(win => {
    if (!win) {
      return undefined;
    }

    const parts = window.location.pathname.split("/");
    if (parts[1] === "recording") {
      return extractIdAndSlug(parts.slice(2)).id;
    }

    return undefined;
  });
}
