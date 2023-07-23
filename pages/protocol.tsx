import { useEffect, useRef, useState } from "react";

// eslint-disable-next-line no-restricted-imports
import { addEventListener, client, initSocket } from "protocol/socket";
import tokenManager from "ui/utils/tokenManager";

async function createSocket(willDestroy = () => {}): Promise<void> {
  const dispatchUrl =
    new URL(location.href).searchParams.get("dispatch") || process.env.NEXT_PUBLIC_DISPATCH_URL!;

  const socket = initSocket(dispatchUrl);
  if (typeof window !== "undefined") {
    if (window.app != null) {
      // @ts-ignore
      window.app.socket = socket;
    }
  }

  const token = await tokenManager.getToken();
  if (token.token) {
    await client.Authentication.setAccessToken({ accessToken: token.token });
  }

  addEventListener("Session.willDestroy", willDestroy);
}

async function runScript(recordingId: string, script: string) {
  // @ts-ignore
  window.client = client;

  const fullScript = `
  (async () => {
      const { sessionId } = await client.Recording.createSession({ recordingId: "${recordingId}" });

      ${script}

      client.Recording.releaseSession({ sessionId });
  })()
  `;

  eval(fullScript);
}

const defaultScript = `
const result = await client.Session.getAnnotationKinds({}, sessionId);
console.log(result);
`;

export default function ProtocolSandbox() {
  const [recordingId, setRecordingId] = useState<string>("1ebb442f-9b2c-45fe-a6ff-bf332f071c8d");
  const scriptRef = useRef();

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    createSocket((...args) => console.log("willDestroy", args)).then(() => {
      setLoading(false);
    });
  }, []);

  const onRun = async () => {
    setRunning(true);

    // @ts-ignore
    const script = scriptRef.current.value;
    await runScript(recordingId, script);
    setRunning(false);
  };

  return (
    <div className="flex h-full">
      <div style={{ width: "200px" }} className=" flex flex-col items-start">
        <button onClick={onRun}>Run</button> {running ? "..." : ""}
        <input
          className="bg-transparent"
          value={recordingId}
          onChange={e => setRecordingId(e.target.value)}
        />
      </div>
      <div className="flex h-full flex-col" style={{ width: "700px" }}>
        <div className=""></div>
        <textarea
          ref={scriptRef}
          className="h-full w-full bg-transparent"
          defaultValue={defaultScript}
        ></textarea>
      </div>
      <div className="flex flex-col">...</div>
    </div>
  );
}
