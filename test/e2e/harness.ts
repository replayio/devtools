import { Page } from "playwright";

declare global {
  const app: any;
}

export default class TestHarness {
  constructor(private readonly page: Page) {}

  async start() {
    await this.page.waitForFunction(() => window.app?.actions);
    this.page.evaluate(() => window.app.actions.setViewMode("dev"));
    await this.page.waitForFunction(() => {
      const loadedRegions = app.selectors.getLoadedRegions();
      const fullyLoaded =
        loadedRegions &&
        loadedRegions.loading.length > 0 &&
        loadedRegions.loaded.length > 0 &&
        loadedRegions.loading[0].end.point === loadedRegions.loaded[0].end.point;
      return (
        fullyLoaded &&
        app.selectors.getViewMode() == "dev" &&
        document.querySelector(".webconsole-app")
      );
    });
  }

  waitForMessage(text: string) {
    return this.page.waitForFunction(text => {
      const messages = document.querySelectorAll(".webconsole-output .message");
      return [...messages].some(message => (message as HTMLElement).innerText.includes(text));
    }, text);
  }
}
