export async function pingTelemetry(event: string, tags: any = {}) {
  if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_RECORD_REPLAY_TELEMETRY) {
    return;
  }

  try {
    const response = await fetch("https://telemetry.replay.io/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event, ...tags }),
    });
    if (!response.ok) {
      console.error(`Sent telemetry event ${event} but got status code ${response.status}`);
    }
  } catch (e) {
    console.error(`Couldn't send telemetry event ${event}`, e);
  }
}
