export async function log(duration: number, data: Object): Promise<void> {
  if (process.env.NODE_ENV !== "development" || process.env.NEXT_PUBLIC_RECORD_REPLAY_TELEMETRY) {
    try {
      const response = await fetch("https://telemetry.replay.io/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          duration,
          ...data,
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
