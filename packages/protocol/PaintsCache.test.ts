import { ScreenShot } from "@replayio/protocol";

import {
  PaintsCache,
  findFirstMeaningfulPaint,
  findMostRecentPaint,
  findNextPaintEvent,
  findPreviousPaintEvent,
  mergedPaintsAndRepaints,
} from "protocol/PaintsCache";
import { screenshotCache } from "replay-next/src/suspense/ScreenshotCache";

describe("PaintsCache", () => {
  let OriginalImage: typeof Image;

  beforeEach(() => {
    OriginalImage = window.Image;

    mergedPaintsAndRepaints.splice(0);

    // jsdom does not load images; we mock it for our purposes to encode expected image dimensions in a JSON string
    // @ts-expect-error
    window.Image = function ImageFactory(width?: number | undefined, height?: number | undefined) {
      const image = new OriginalImage(width, height);
      setTimeout(() => {
        try {
          const source = image.src;
          const { height, width } = JSON.parse(source.substring(source.indexOf(",") + 1)) as any;

          image.height = height;
          image.width = width;

          image.dispatchEvent(new Event("load"));
        } catch (error) {
          console.error(error);

          image.dispatchEvent(new Event("error"));
        }
      });
      return image;
    };
  });

  afterEach(() => {
    window.Image = OriginalImage;
  });

  function preCacheScreenshot(base64: string, mimeType: ScreenShot["mimeType"], data: string) {
    if (base64) {
      screenshotCache.cache(
        {
          data,
          hash: base64,
          mimeType,
          scale: 1,
        },
        null as any,
        null as any,
        base64
      );
    }
  }

  describe("findFirstMeaningfulPaint", () => {
    it("should return undefined if no paints have been loaded", async () => {
      PaintsCache.cache([]);

      const firstMeaningfulPaint = await findFirstMeaningfulPaint();
      expect(firstMeaningfulPaint).toBeUndefined();
    });

    it('should return the first "meaningful" paint in the sequence of loaded paints', async () => {
      PaintsCache.cache([
        { time: 0, point: "0", paintHash: "" },
        {
          time: 10,
          point: "10",
          paintHash: JSON.stringify({ height: 50, width: 50 }),
        },
        {
          time: 20,
          point: "20",
          paintHash: JSON.stringify({
            height: 50,
            width: 50,
            junk: "This is a long string to make the image seem like it has a lot of unique pixels/colors",
          }),
        },
      ]);

      const points = PaintsCache.read();
      points?.forEach(point => preCacheScreenshot(point.paintHash, "image/jpeg", point.paintHash));

      const firstMeaningfulPaint = await findFirstMeaningfulPaint();
      expect(firstMeaningfulPaint?.time).toBe(20);
    });
  });

  describe("findMostRecentPaint", () => {
    it("should return the expected paint", () => {
      PaintsCache.cache([
        { time: 0, point: "0", paintHash: "" },
        { time: 10, point: "10", paintHash: "" },
        { time: 20, point: "20", paintHash: "" },
      ]);

      expect(findMostRecentPaint(0)?.time).toBe(0);
      expect(findMostRecentPaint(1)?.time).toBe(0);
      expect(findMostRecentPaint(9)?.time).toBe(0);

      expect(findMostRecentPaint(10)?.time).toBe(10);
      expect(findMostRecentPaint(11)?.time).toBe(10);
      expect(findMostRecentPaint(19)?.time).toBe(10);

      expect(findMostRecentPaint(20)?.time).toBe(20);
      expect(findMostRecentPaint(21)?.time).toBe(20);
    });
  });

  describe("findNextPaintEvent", () => {
    it("should return the expected paint", () => {
      PaintsCache.cache([
        { time: 0, point: "0", paintHash: "" },
        { time: 10, point: "10", paintHash: "" },
        { time: 20, point: "20", paintHash: "" },
      ]);

      expect(findNextPaintEvent(0)?.time).toBe(10);
      expect(findNextPaintEvent(9)?.time).toBe(10);

      expect(findNextPaintEvent(10)?.time).toBe(20);
      expect(findNextPaintEvent(19)?.time).toBe(20);

      expect(findNextPaintEvent(20)).toBeNull();
    });
  });

  describe("findPreviousPaintEvent", () => {
    it("should return the expected paint", () => {
      PaintsCache.cache([
        { time: 0, point: "0", paintHash: "" },
        { time: 10, point: "10", paintHash: "" },
        { time: 20, point: "20", paintHash: "" },
      ]);

      expect(findPreviousPaintEvent(0)).toBeNull();

      expect(findPreviousPaintEvent(1)?.time).toBe(0);
      expect(findPreviousPaintEvent(9)?.time).toBe(0);
      expect(findPreviousPaintEvent(10)?.time).toBe(0);

      expect(findPreviousPaintEvent(11)?.time).toBe(10);
      expect(findPreviousPaintEvent(19)?.time).toBe(10);
      expect(findPreviousPaintEvent(20)?.time).toBe(10);

      expect(findPreviousPaintEvent(21)?.time).toBe(20);
    });
  });
});
