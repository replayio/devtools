import os from "os";

export async function waitUntilMessage(page: any, message: string, timeout = 60_000): Promise<any> {
  return await new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error(`Timed out waiting for "${message}" message`)), timeout);
    page.on("console", async (msg: any) => {
      try {
        const firstArg = await msg.args()[0]?.jsonValue();
        if (firstArg === message) {
          const secondArg = await msg.args()[1]?.jsonValue();
          resolve(secondArg);
        }
      } catch (e) {
        console.log("Unserializable value");
      }
    });
  });
}

export function tmpFile() {
  return os.tmpdir() + "/" + ((Math.random() * 1e9) | 0);
}

export function reportError(message: string, ...rest: any[]) {
  // Log an error which github will recognize.
  console.error(`::error ::Failure ${message}`, ...rest);
}
