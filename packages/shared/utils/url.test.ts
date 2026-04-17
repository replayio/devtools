import { getFlag, hasFlag } from "./url";

describe("shared url flags", () => {
  let restoreLocation: () => void;

  afterEach(() => {
    restoreLocation?.();
  });

  function setLocation(url: string) {
    restoreLocation?.();
    const previous = window.location;
    delete (window as any).location;
    (window as any).location = new URL(url);
    restoreLocation = () => {
      delete (window as any).location;
      (window as any).location = previous;
    };
  }

  it("getFlag reads query param from current location", () => {
    setLocation("http://localhost/?foo=bar&empty=");
    expect(getFlag("foo")).toBe("bar");
    expect(getFlag("missing")).toBeNull();
    expect(getFlag("empty")).toBe("");
  });

  it("hasFlag is true only when the param is present", () => {
    setLocation("http://localhost/?on");
    expect(hasFlag("on")).toBe(true);
    expect(hasFlag("off")).toBe(false);
  });
});
