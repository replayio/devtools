import { encodeObjectToURL } from "shared/utils/environment";
import { getMutableParamsFromURL } from "ui/setup/dynamic/url";

describe("getPauseParams", () => {
  const urlWithFocusWindow = (focusWindow: string) => {
    return `https://app.replay.io/recording/12345?point=23456&time=2&focusWindow=${focusWindow}`;
  };

  const focusWindowParams: string = encodeObjectToURL({
    begin: { point: "12345", time: 1 },
    end: { point: "67890", time: 2 },
  })!;
  const malformedParams = focusWindowParams.slice(0, focusWindowParams.length - 2);
  it("can parse correctly formed parameters", () => {
    const original = window.location.href;
    window.location.href = urlWithFocusWindow(focusWindowParams);

    const { focusWindow, point, time } = getMutableParamsFromURL();
    expect({ focusWindow, point, time }).toMatchInlineSnapshot(`
      Object {
        "focusWindow": Object {
          "begin": Object {
            "point": "12345",
            "time": 1,
          },
          "end": Object {
            "point": "67890",
            "time": 2,
          },
        },
        "point": "23456",
        "time": 2,
      }
    `);

    window.location.href = original;
  });

  it("does not blow up on malformed parameters", () => {
    const original = window.location.href;
    window.location.href = urlWithFocusWindow(malformedParams);

    expect(getMutableParamsFromURL()?.focusWindow).toBeUndefined();

    window.location.href = original;
  });
});

describe("encodeObjectToUrl", () => {
  const focusWindow = {
    begin: { point: "12345", time: 1 },
    end: { point: "67890", time: 10 },
  };

  it("base64 encodes the JSON value", () => {
    expect(encodeObjectToURL(focusWindow)).toMatchInlineSnapshot(
      `"eyJiZWdpbiI6eyJwb2ludCI6IjEyMzQ1IiwidGltZSI6MX0sImVuZCI6eyJwb2ludCI6IjY3ODkwIiwidGltZSI6MTB9fQ%3D%3D"`
    );
  });

  it("has to be URL decoded before it can be parsed as base64", () => {
    const encoded: string = encodeObjectToURL(focusWindow)!;

    expect(() => {
      atob(encoded);
    }).toThrowError("The string to be decoded contains invalid characters.");
  });

  it("can be decoded to the JSON representation of the original", () => {
    const encoded: string = encodeObjectToURL(focusWindow)!;

    expect(atob(decodeURIComponent(encoded))).toEqual(JSON.stringify(focusWindow));
  });
});
