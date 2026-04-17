import { getOS, isMacOS, isWindowsOS } from "./os";

describe("os", () => {
  const originalUA = window.navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(window.navigator, "userAgent", {
      value: originalUA,
      configurable: true,
    });
  });

  function setUserAgent(ua: string) {
    Object.defineProperty(window.navigator, "userAgent", {
      value: ua,
      configurable: true,
    });
  }

  it("maps Linux user agents", () => {
    setUserAgent("Mozilla/5.0 (X11; Linux x86_64)");
    expect(getOS()).toBe("Linux");
    expect(isMacOS()).toBe(false);
    expect(isWindowsOS()).toBe(false);
  });

  it("maps Windows user agents", () => {
    setUserAgent("Mozilla/5.0 (Windows NT 10.0)");
    expect(getOS()).toBe("WINNT");
    expect(isWindowsOS()).toBe(true);
    expect(isMacOS()).toBe(false);
  });

  it("maps macOS user agents", () => {
    setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)");
    expect(getOS()).toBe("Darwin");
    expect(isMacOS()).toBe(true);
    expect(isWindowsOS()).toBe(false);
  });

  it("returns Unknown for unrecognized agents", () => {
    setUserAgent("SomeOtherClient/1.0");
    expect(getOS()).toBe("Unknown");
  });
});
