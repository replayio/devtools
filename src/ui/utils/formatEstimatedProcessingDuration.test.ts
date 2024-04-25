import { formatEstimatedProcessingDuration } from "ui/utils/formatEstimatedProcessingDuration";

describe("formatEstimatedProcessingDuration", () => {
  it("should round up to the nearest minute", () => {
    expect(formatEstimatedProcessingDuration(0)).toEqual("1 minute");
    expect(formatEstimatedProcessingDuration(30_000)).toEqual("1 minute");
    expect(formatEstimatedProcessingDuration(60_000)).toEqual("1 minute");
    expect(formatEstimatedProcessingDuration(60_001)).toEqual("2 minutes");
    expect(formatEstimatedProcessingDuration(1000 * 60 * 30)).toEqual("30 minutes");
    expect(formatEstimatedProcessingDuration(1000 * 60 * 60)).toEqual("1 hour");
  });
});
