const { ThreadFront } = require("./thread");
const { sendMessage } = require("./socket");
const { defer } = require("./utils");

const resizeHeightForTooltip = 180;

export class DownloadCancelledError extends Error {}

export interface Screenshot {
  data: string;
  hash: string;
  mimeType: string;
}

export interface QueuedScreenshotDownload {
  point: string;
  paintHash: string;
  promise: Promise<Screenshot>;
  resolve: (screenshot: Screenshot) => void;
  reject: (reason: any) => void;
}

/**
 * This class manages the screenshot downloads and caches downloaded screenshots.
 * It throttles the screenshot downloads for the tooltip, only starting
 * one download at a time and queueing one more download at most.
 * When a tooltip download is requested while another tooltip download is queued,
 * the queued download is cancelled and the requested download is queued instead.
 * Downloads for playback are run independently of those for the tooltip.
 */
export class ScreenshotCache {
  // Map paint hashes to a promise that resolves with the associated screenshot.
  private fullsizeCache = new Map<string, Promise<Screenshot>>();
  private resizedCache = new Map<string, Promise<Screenshot>>();

  private queuedDownloadForTooltip: QueuedScreenshotDownload | undefined;
  private runningDownloadForTooltip = false;

  /**
   * Returns a promise for the requested screenshot. The promise may be rejected
   * if another tooltip screenshot is requested before this download was started.
   */
  async getScreenshotForTooltip(point: string, paintHash: string): Promise<Screenshot> {
    if (this.resizedCache.has(paintHash)) {
      return this.resizedCache.get(paintHash)!;
    }
    if (this.fullsizeCache.has(paintHash)) {
      return this.fullsizeCache.get(paintHash)!;
    }
    if (this.queuedDownloadForTooltip && this.queuedDownloadForTooltip.point === point) {
      return this.queuedDownloadForTooltip.promise;
    }

    if (this.queuedDownloadForTooltip) {
      this.queuedDownloadForTooltip.reject(new DownloadCancelledError());
      this.queuedDownloadForTooltip = undefined;
    }

    const { promise, resolve, reject } = defer();
    this.queuedDownloadForTooltip = { point, paintHash, promise, resolve, reject };

    this.startQueuedDownloadIfPossible();

    return promise;
  }

  /**
   * Returns a promise for the requested screenshot. The download will be started
   * immediately and will only be rejected if sendMessage() throws.
   */
  async getScreenshotForPlayback(point: string, paintHash: string): Promise<Screenshot> {
    if (this.fullsizeCache.has(paintHash)) {
      return this.fullsizeCache.get(paintHash)!;
    }

    const promise = this.download(point);

    this.fullsizeCache.set(paintHash, promise);
    return promise;
  }

  private async startQueuedDownloadIfPossible() {
    if (this.queuedDownloadForTooltip && !this.runningDownloadForTooltip) {
      this.downloadQueued();
    }
  }

  addScreenshot(screenshot: Screenshot) {
    this.fullsizeCache.set(screenshot.hash, Promise.resolve(screenshot));
  }

  private async downloadQueued() {
    if (!this.queuedDownloadForTooltip) return;

    const { point, paintHash, promise, resolve, reject } = this.queuedDownloadForTooltip;

    this.queuedDownloadForTooltip = undefined;
    this.runningDownloadForTooltip = true;

    this.resizedCache.set(paintHash, promise);

    try {
      const screen = await this.download(point, resizeHeightForTooltip);
      resolve(screen);
    } catch (e) {
      reject(e);
    }

    this.runningDownloadForTooltip = false;

    this.startQueuedDownloadIfPossible();
  }

  private async download(point: string, resizeHeight?: number): Promise<Screenshot> {
    const screen = (
      await sendMessage(
        "Graphics.getPaintContents",
        { point, mimeType: "image/jpeg", resizeHeight },
        ThreadFront.sessionId
      )
    ).screen;

    return screen;
  }
}
