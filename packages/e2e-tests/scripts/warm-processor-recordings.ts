#!/usr/bin/env ts-node

// Starts a processor for every example recording and waits until each one has finished
// processing, so the processor-session e2e tests open warm recordings instead of each test
// waiting for a cold start. Processors shut down after 30 minutes without activity, so run
// this shortly before the tests.

import chalk from "chalk";

import examples from "../examples.json";
import { withExponentialBackoff } from "./exponential-backoff";

const MCP_URL = process.env.REPLAY_MCP_URL || "https://dispatch.replay.io/nut/mcp";
const API_KEY = process.env.RECORD_REPLAY_API_KEY;

const CONCURRENCY = Number(process.env.WARM_CONCURRENCY || 8);
const DEADLINE_MS = Number(process.env.WARM_DEADLINE_MINUTES || 20) * 60_000;
const WAIT_SECONDS_PER_CALL = 60;
const REQUEST_TIMEOUT_MS = (WAIT_SECONDS_PER_CALL + 30) * 1000;

// Example keys whose recordings are expected to be unavailable.
const SKIPPED_EXAMPLES = new Set(["deleted-replay"]);

type WarmState = "ready" | "processing" | "crashed" | "failed";

type WarmResult = {
  state: WarmState;
  phase: string;
  elapsedMs: number;
  error?: string;
};

type Outcome = {
  exampleKey: string;
  recordingId: string;
  state: WarmState | "timed out" | "error";
  elapsedMs: number;
  detail?: string;
};

class McpSession {
  private headers: Record<string, string>;
  private nextId = 1;

  constructor(apiKey: string) {
    this.headers = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${apiKey}`,
      "x-replay-source": "devtools-e2e",
    };
  }

  async initialize() {
    const response = await this.post({
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "devtools-e2e-warm-recordings", version: "1.0.0" },
      },
      id: this.nextId++,
    });
    const sessionId = response.headers.get("mcp-session-id");
    if (sessionId) {
      this.headers["mcp-session-id"] = sessionId;
    }
    await readJsonRpcResult(response);
    await this.post({ method: "notifications/initialized" });
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<string> {
    const response = await this.post({
      method: "tools/call",
      params: { name, arguments: args },
      id: this.nextId++,
    });
    const result = await readJsonRpcResult(response);
    const text = (result.content ?? [])
      .filter(item => item.type === "text" && typeof item.text === "string")
      .map(item => item.text)
      .join("\n");
    if (result.isError) {
      throw new Error(`${name} failed: ${text}`);
    }
    return text;
  }

  private async post(body: Record<string, unknown>) {
    const response = await fetch(MCP_URL, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ jsonrpc: "2.0", ...body }),
      // Requests occasionally stall without an error; fetch's own limit is five minutes.
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.status} ${await response.text()}`);
    }
    return response;
  }
}

type ToolResult = {
  content?: { type: string; text?: string }[];
  isError?: boolean;
};

// The server answers with either plain JSON or a stream of server-sent events.
async function readJsonRpcResult(response: Response): Promise<ToolResult> {
  const body = await response.text();
  const messages = response.headers.get("content-type")?.includes("text/event-stream")
    ? body
        .split("\n\n")
        .map(event =>
          event
            .split("\n")
            .filter(line => line.startsWith("data:"))
            .map(line => line.replace(/^data:\s?/, ""))
            .join("")
        )
        .filter(data => data.length > 0)
    : [body];

  for (const message of messages.reverse()) {
    const json = JSON.parse(message);
    if (json.error) {
      throw new Error(json.error.message || JSON.stringify(json.error));
    }
    if (json.result) {
      return json.result;
    }
  }
  return {};
}

async function warmRecording(
  apiKey: string,
  exampleKey: string,
  recordingId: string,
  deadline: number
): Promise<Outcome> {
  const startedAt = Date.now();
  const session = new McpSession(apiKey);
  await withExponentialBackoff(() => session.initialize(), 1000, 5);

  let crashRetried = false;
  while (true) {
    const text = await withExponentialBackoff(
      async () => {
        try {
          return await session.callTool("WarmRecording", {
            recordingId,
            waitSeconds: Math.min(
              WAIT_SECONDS_PER_CALL,
              Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
            ),
          });
        } catch (error) {
          console.log(
            `${exampleKey} (${recordingId}): WarmRecording request failed: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
          throw error;
        }
      },
      1000,
      5
    );
    const result: WarmResult = JSON.parse(text);
    const elapsedMs = Date.now() - startedAt;

    if (result.state === "ready") {
      return { exampleKey, recordingId, state: "ready", elapsedMs };
    }
    if (result.state === "crashed" || result.state === "failed") {
      // The backend replaces a crashed processor with a fresh one on the next call after a
      // short delay. Crashes often repeat, so retry once.
      if (!crashRetried) {
        crashRetried = true;
        console.log(
          `${exampleKey} (${recordingId}): ${result.state}, retrying once: ${result.error ?? ""}`
        );
        await new Promise(resolve => setTimeout(resolve, 150_000));
        continue;
      }
      return { exampleKey, recordingId, state: result.state, elapsedMs, detail: result.error };
    }
    if (Date.now() >= deadline) {
      return { exampleKey, recordingId, state: "timed out", elapsedMs, detail: result.phase };
    }
  }
}

async function main() {
  if (!API_KEY) {
    throw new Error("RECORD_REPLAY_API_KEY must be set");
  }

  const recordings = Object.entries(examples)
    .filter(([exampleKey]) => !SKIPPED_EXAMPLES.has(exampleKey))
    .map(([exampleKey, example]) => ({ exampleKey, recordingId: example.recording }));

  console.log(
    `Warming ${recordings.length} recordings via ${MCP_URL} (${CONCURRENCY} at a time, ${
      DEADLINE_MS / 60_000
    } minute limit)`
  );

  const deadline = Date.now() + DEADLINE_MS;
  const outcomes: Outcome[] = [];
  const queue = [...recordings];

  async function worker() {
    while (queue.length > 0) {
      const { exampleKey, recordingId } = queue.shift()!;
      const startedAt = Date.now();
      let outcome: Outcome;
      try {
        outcome = await warmRecording(API_KEY!, exampleKey, recordingId, deadline);
      } catch (error) {
        outcome = {
          exampleKey,
          recordingId,
          state: "error",
          elapsedMs: Date.now() - startedAt,
          detail: error instanceof Error ? error.message : String(error),
        };
      }
      const color = outcome.state === "ready" ? chalk.green : chalk.yellow;
      console.log(
        `${color(outcome.state.padEnd(10))} ${(outcome.elapsedMs / 1000)
          .toFixed(0)
          .padStart(4)}s  ${outcome.exampleKey} (${outcome.recordingId})${
          outcome.detail ? `: ${outcome.detail}` : ""
        }`
      );
      outcomes.push(outcome);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const notReady = outcomes.filter(outcome => outcome.state !== "ready");
  console.log(`\n${outcomes.length - notReady.length}/${outcomes.length} recordings ready`);

  // Recordings that did not warm up are reported but don't fail this step; the tests that use
  // them still run and show what that means for DevTools.
  for (const outcome of notReady) {
    if (process.env.GITHUB_ACTIONS) {
      console.log(
        `::warning title=Recording not warmed::${outcome.exampleKey} (${outcome.recordingId}): ${
          outcome.state
        }${outcome.detail ? ` - ${outcome.detail}` : ""}`
      );
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
