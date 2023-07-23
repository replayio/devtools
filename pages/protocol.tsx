import { useRouter } from "next/router";
import pako from "pako";
import { useEffect, useMemo, useRef, useState } from "react";

// eslint-disable-next-line no-restricted-imports
import { addEventListener, client, initSocket } from "protocol/socket";
import { MonacoEditor } from "ui/components/Protocol/Editor";
import tokenManager from "ui/utils/tokenManager";

function compressToURLSafeBase64(str: string) {
  const compressed = pako.deflate(str, { to: "Uint8Array" });
  let base64 = btoa(String.fromCharCode.apply(null, compressed));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decompressFromURLSafeBase64(base64Str: string) {
  try {
    base64Str = base64Str.replace(/-/g, "+").replace(/_/g, "/");
    const compressed = Uint8Array.from(atob(base64Str), c => c.charCodeAt(0));
    return pako.inflate(compressed, { to: "string" });
  } catch (e) {
    return base64Str;
  }
}

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

const defaultScript = {
  "Get Annotation Kinds": `
const result = await client.Session.getAnnotationKinds({}, sessionId);
console.log(result);
`,
  "Get Sources": `
const result = await client.Session.getAnnotationKinds({}, sessionId);
console.log(result);
`,
};

function getStoredValue(key: string, defaultValue: Object) {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  } catch (error) {
    console.warn("Error reading from localStorage:", error);
    return defaultValue;
  }
}

function saveToLocalStorage(key: string, value: Object) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Error writing to localStorage:", error);
  }
}

function useLocalStorage(key: string, defaultValue = {}) {
  const [data, setData] = useState(() => getStoredValue(key, defaultValue));

  useEffect(() => {
    saveToLocalStorage(key, data);
  }, [key, data]);

  return [data, setData];
}

export default function ProtocolSandbox() {
  const router = useRouter();

  const [recordingId, setRecordingId] = useState<string>("1ebb442f-9b2c-45fe-a6ff-bf332f071c8d");
  //   const [code, setCode] = useState(defaultScript);
  const [selectedScript, setSelectedScript] = useState<string>(
    (router.query.title as string) || "Get Annotation Kinds"
  );
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [scripts, setScripts] = useLocalStorage("scripts", defaultScript);
  const [showNewScript, toggleNewScript] = useState(false);

  useEffect(() => {
    router.replace({
      query: {
        script: scripts[selectedScript],
        title: selectedScript,
      },
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scripts, selectedScript]);

  const code = useMemo(
    () => decompressFromURLSafeBase64(scripts[selectedScript]),
    [scripts, selectedScript]
  );

  useEffect(() => {
    createSocket((...args) => console.log("willDestroy", args)).then(() => {
      setLoading(false);
    });
  }, []);

  const onRun = async () => {
    setRunning(true);

    // @ts-ignore
    await runScript(recordingId, code);
    setRunning(false);
  };

  const onChange = (newValue: string) => {
    const compressedText = compressToURLSafeBase64(newValue);

    router.replace({
      query: {
        script: compressedText,
        title: selectedScript,
      },
    });

    setScripts({ ...scripts, [selectedScript]: compressedText });
  };

  return (
    <div className="flex h-full" style={{ backgroundColor: "#1e1e1e" }}>
      <div style={{ width: "200px" }} className=" flex flex-col items-start p-2 text-sm">
        <button className="font-bold" onClick={onRun}>
          Run
        </button>{" "}
        {running ? "..." : ""}
        <input
          className="bg-transparent"
          value={recordingId}
          onChange={e => setRecordingId(e.target.value)}
        />
        <div className="mt-4 flex flex-col ">
          <div className="flex justify-between">
            <div className="font-bold">Scripts</div>

            <div onClick={() => toggleNewScript(!showNewScript)}>+</div>
          </div>

          {Object.keys(scripts).map(key => (
            <div
              onClick={() => {
                console.log(key);
                setSelectedScript(key);
              }}
              className={`${selectedScript == key ? "font-bold" : ""} `}
              key={key}
            >
              {key}
            </div>
          ))}

          {showNewScript && (
            <input
              onKeyDown={(e: any) => {
                if (e.key == "Enter") {
                  setScripts({ ...scripts, [e.target.value]: "" });
                  toggleNewScript(false);
                }
              }}
              className="mt-1 w-full bg-transparent"
              placeholder="Add new script"
            ></input>
          )}
        </div>
      </div>
      <div className="flex h-full flex-col" style={{ width: "100%" }}>
        <MonacoEditor defaultValue={code} onChange={onChange} />
      </div>
    </div>
  );
}
