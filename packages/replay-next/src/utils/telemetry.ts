import assert from "assert";

let defaultTags = {};
export function setDefaultTags(tags: Object) {
  defaultTags = tags;
}

export async function recordData(event: string, tags: Object = {}): Promise<void> {
  const eventTags = { ...defaultTags, ...tags };
  if (process.env.NODE_ENV !== "development" || process.env.NEXT_PUBLIC_RECORD_REPLAY_TELEMETRY) {
    try {
      const response = await fetch("https://telemetry.replay.io/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event,
          ...eventTags,
        }),
      });

      if (!response.ok) {
        console.error(`Telemetry request returned unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.error("Telemetry request failed:", error);
    }
  }
}

export function assertWithTelemetry(
  assertion: unknown,
  message: string,
  type: string,
  tags: Object = {}
): asserts assertion {
  if (!assertion) {
    recordData(type, {
      message,
      ...tags,
    });
  }

  return assert(assertion, message);
}
