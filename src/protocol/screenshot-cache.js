const { ThreadFront } = require("./thread");
const { sendMessage } = require("./socket");
const { defer } = require("./utils");

export class DownloadCancelledError extends Error {}

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
  _cache = new Map();

  _queuedDownloadForTooltip;
  _runningDownloadForTooltip = false;

  /**
   * Returns a promise for the requested screenshot. The promise may be rejected
   * if another tooltip screenshot is requested before this download was started.
   */
  async getScreenshotForTooltip(point, paintHash) {
    if (this._cache.has(paintHash)) {
      return this._cache.get(paintHash);
    }
    if (this._queuedDownloadForTooltip && (this._queuedDownloadForTooltip.point === point)) {
      return this._queuedDownloadForTooltip.promise;
    }

    if (this._queuedDownloadForTooltip) {
      this._queuedDownloadForTooltip.reject(new DownloadCancelledError());
      this._queuedDownloadForTooltip = undefined;
    }

    const { promise, resolve, reject } = defer();
    this._queuedDownloadForTooltip = { point, paintHash, promise, resolve, reject };

    this._startQueuedDownloadIfPossible();

    return promise;
  }

  /**
   * Returns a promise for the requested screenshot. The download will be started
   * immediately and will only be rejected if sendMessage() throws.
   */
  async getScreenshotForPlayback(point, paintHash) {
    if (this._cache.has(paintHash)) {
      return this._cache.get(paintHash);
    }

    const promise = this._download(point);

    this._cache.set(paintHash, promise);
    return promise;
  }

  async _startQueuedDownloadIfPossible() {
    if (this._queuedDownloadForTooltip && !this._runningDownloadForToolTip) {
      this._downloadQueued();
    }
  }

  addScreenshot(screenshot) {
      this._cache.set(screenshot.hash, Promise.resolve(screenshot));
  }

  async _downloadQueued() {
    const { point, paintHash, promise, resolve, reject } = this._queuedDownloadForTooltip;

    this._queuedDownloadForTooltip = undefined;
    this._runningDownloadForToolTip = true;

    this._cache.set(paintHash, promise);

    try {
      const screen = await this._download(point);
      resolve(screen);
    } catch (e) {
      reject(e);
    }

    this._runningDownloadForToolTip = false;

    this._startQueuedDownloadIfPossible();
  }

  async _download(point) {
    const screen = (
      await sendMessage(
        "Graphics.getPaintContents",
        { point, mimeType: "image/jpeg" },
        ThreadFront.sessionId
      )
    ).screen;

    return screen;
  }
}
