const { ThreadFront } = require("./thread");
const { sendMessage } = require("./socket");
const { defer } = require("./utils");

const maxRunningDownloads = 1;

/**
 * This class throttles the screenshot downloads, only starting maxRunningDownloads simultaneously.
 * It may also reorder the downloads by starting the most recently requested ones first.
 */
export class ScreenshotDownloads {

    requestedDownloads = [];

    runningDownloads = 0;

    async downloadScreenshot(point) {

        const { promise, resolve } = defer();
        this.requestedDownloads.push({ point, resolve });

        this._startDownloads();

        return promise;
    }

    _startDownloads() {
        while ((this.runningDownloads < maxRunningDownloads) && (this.requestedDownloads.length > 0)) {
            this._downloadOneScreenshot();
        }
    }

    async _downloadOneScreenshot() {

        // we always download the most recently requested screenshots first,
        // because those are the ones that the user is probably currently most interested in
        const { point, resolve } = this.requestedDownloads.pop();

        this.runningDownloads++;

        try {

            const screen = (
                await sendMessage(
                  "Graphics.getPaintContents",
                  { point, mimeType: "image/jpeg" },
                  ThreadFront.sessionId
                )
              ).screen;
    
            resolve(screen);

        } catch {
            resolve(null);
        }

        this.runningDownloads--;
        this._startDownloads();
    }
}
