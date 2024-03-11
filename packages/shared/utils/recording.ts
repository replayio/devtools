import slugify from "slugify";

import { RecordingTarget, getRecordingTarget } from "replay-next/src/suspense/BuildIdCache";
import { Recording } from "shared/graphql/types";
import { SLUG_SEPARATOR, extractIdAndSlug } from "shared/utils/slug";

const WARNING_MS = 60 * 2 * 1000;

export const showDurationWarning = (recording: Recording) =>
  !!recording.duration && recording.duration > WARNING_MS;

export function getRecordingURL(recording: Recording): string {
  const target = recording.buildId ? getRecordingTarget(recording.buildId) : undefined;

  let useLegacyURL = false;
  switch (target) {
    case RecordingTarget.gecko:
      useLegacyURL = true;
      break;
  }

  let id = recording.id;
  if (recording.title) {
    id = slugify(recording.title, { strict: true }).toLowerCase() + SLUG_SEPARATOR + recording.id;
  }

  return useLegacyURL ? `https://legacy.replay.io/recording/${id}` : `/recording/${id}`;
}

export function getRecordingId(): string | undefined {
  if (typeof window !== "undefined" && window != null) {
    const pathname = window.location.pathname;
    return extractRecordingIdFromPathname(pathname);
  }
}

export function extractRecordingIdFromPathname(pathname: string): string | undefined {
  const parts = pathname.split("/");
  if (parts[1] === "recording") {
    return extractIdAndSlug(parts.slice(2)).id;
  }

  return undefined;
}
