import { encodeObjectToURL, getPausePointParams } from "ui/utils/environment";

describe("getPauseParams", () => {
  const urlWithFocusRegion = (focusRegion: string) => {
    return `https://app.replay.io/recording/12345?point=23456&time=2&focusRegion=${focusRegion}`;
  };

  const focusRegionParams: string = encodeObjectToURL({
    begin: { point: "12345", time: 1 },
    end: { point: "67890", time: 2 },
  })!;
  const malformedParams = focusRegionParams.slice(0, focusRegionParams.length - 2);
  it("can parse correctly formed parameters", () => {
    const original = window.location.href;
    window.location.href = urlWithFocusRegion(focusRegionParams);

    expect(getPausePointParams()).toMatchInlineSnapshot(`
      Object {
        "focusRegion": Object {
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
    window.location.href = urlWithFocusRegion(malformedParams);

    expect(getPausePointParams()?.focusRegion).toBeUndefined();

    window.location.href = original;
  });
});

describe("encodeObjectToUrl", () => {
  const focusRegion = {
    begin: { point: "12345", time: 1 },
    end: { point: "67890", time: 10 },
  };

  it("base64 encodes the JSON value", () => {
    expect(encodeObjectToURL(focusRegion)).toMatchInlineSnapshot(
      `"eyJiZWdpbiI6eyJwb2ludCI6IjEyMzQ1IiwidGltZSI6MX0sImVuZCI6eyJwb2ludCI6IjY3ODkwIiwidGltZSI6MTB9fQ%3D%3D"`
    );
  });

  it("has to be URL decoded before it can be parsed as base64", () => {
    const encoded: string = encodeObjectToURL(focusRegion)!;

    expect(() => {
      atob(encoded);
    }).toThrowError("The string to be decoded contains invalid characters.");
  });

  it("can be decoded to the JSON representation of the original", () => {
    const encoded: string = encodeObjectToURL(focusRegion)!;

    expect(atob(decodeURIComponent(encoded))).toEqual(JSON.stringify(focusRegion));
  });
});
