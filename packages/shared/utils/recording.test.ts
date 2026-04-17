jest.mock("slugify", () => ({
  __esModule: true,
  default: (s: string) => s,
}));

jest.mock("replay-next/src/suspense/BuildIdCache", () => ({
  RecordingTarget: {
    gecko: "gecko",
    chromium: "chromium",
    node: "node",
    unknown: "unknown",
  },
  getRecordingTarget: jest.fn(),
}));

import type { Recording } from "shared/graphql/types";

import { getRecordingTarget, RecordingTarget } from "replay-next/src/suspense/BuildIdCache";
import { SLUG_SEPARATOR } from "shared/utils/slug";

import {
  extractRecordingIdFromPathname,
  getRecordingURL,
  showDurationWarning,
} from "./recording";

function minimalRecording(overrides: Partial<Recording> = {}): Recording {
  return {
    date: "2020-01-01",
    duration: null,
    id: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
    testRunId: null,
    ...overrides,
  };
}

describe("recording", () => {
  const getRecordingTargetMock = getRecordingTarget as jest.MockedFunction<typeof getRecordingTarget>;

  beforeEach(() => {
    getRecordingTargetMock.mockReset();
  });

  describe("extractRecordingIdFromPathname", () => {
    it("extracts UUID from /recording/:id", () => {
      const id = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
      expect(extractRecordingIdFromPathname(`/recording/${id}`)).toBe(id);
    });

    it("extracts id from slug--uuid under /recording/", () => {
      const id = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
      const path = `/recording/title${SLUG_SEPARATOR}${id}`;
      expect(extractRecordingIdFromPathname(path)).toBe(id);
    });

    it("returns undefined when not under /recording/", () => {
      expect(extractRecordingIdFromPathname(`/${"aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee"}`)).toBeUndefined();
      expect(extractRecordingIdFromPathname("/")).toBeUndefined();
    });
  });

  describe("showDurationWarning", () => {
    it("is true only when duration exceeds two minutes in ms", () => {
      expect(showDurationWarning(minimalRecording({ duration: 120_001 }))).toBe(true);
      expect(showDurationWarning(minimalRecording({ duration: 120_000 }))).toBe(false);
      expect(showDurationWarning(minimalRecording({ duration: null }))).toBe(false);
      expect(showDurationWarning(minimalRecording({ duration: 0 }))).toBe(false);
    });
  });

  describe("getRecordingURL", () => {
    it("uses legacy host for gecko targets", () => {
      getRecordingTargetMock.mockReturnValue(RecordingTarget.gecko);
      const rec = minimalRecording({ buildId: "firefox-gecko", title: null });
      expect(getRecordingURL(rec, true)).toBe(
        `https://legacy.replay.io/recording/${rec.id}`
      );
    });

    it("includes /recording/ path when includeBasePath is true for non-gecko", () => {
      getRecordingTargetMock.mockReturnValue(RecordingTarget.chromium);
      const rec = minimalRecording({ buildId: "chromium", title: null });
      expect(getRecordingURL(rec, true)).toBe(`/recording/${rec.id}`);
    });

    it("omits recording segment when includeBasePath is false", () => {
      getRecordingTargetMock.mockReturnValue(RecordingTarget.chromium);
      const rec = minimalRecording({ buildId: "chromium", title: null });
      expect(getRecordingURL(rec, false)).toBe(`/${rec.id}`);
    });

    it("prefixes id with slugified title and separator when title is set", () => {
      getRecordingTargetMock.mockReturnValue(RecordingTarget.chromium);
      const rec = minimalRecording({
        buildId: "chromium",
        title: "MyTitle",
      });
      expect(getRecordingURL(rec, true)).toBe(
        `/recording/mytitle${SLUG_SEPARATOR}${rec.id}`
      );
    });
  });
});
