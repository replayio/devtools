import { existsSync, readFileSync } from "fs";
import { IncomingMessage, ServerResponse } from "http";
import path, { join } from "path";

const baseDir = join(__dirname, "..", "..", "..", "..");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
  "Content-Type": "application/json",
};

export default (request: IncomingMessage, response: ServerResponse) => {
  const fixtureDataPath = getQueryParam(request, "fixtureDataPath");
  if (fixtureDataPath == null) {
    const errorMessage = "No :fixtureDataPath query parameter specified.";

    console.error(errorMessage);

    response.writeHead(404, headers);
    response.end(JSON.stringify({ error: errorMessage }));
  } else {
    const fixturePath = path.join(baseDir, "playwright", "protocol-fixtures", fixtureDataPath);
    if (!existsSync(fixturePath)) {
      const errorMessage = `No fixture data found at path: ${fixturePath}`;

      console.error(errorMessage);

      response.writeHead(404, headers);
      response.end(JSON.stringify({ error: errorMessage }));
    } else {
      const fixtureData = readFileSync(fixturePath, "utf-8");
      response.writeHead(200, headers);
      response.end(fixtureData);
    }
  }
};

function getQueryParam(request: IncomingMessage, key: string): string | null {
  const url = request.url;
  if (url != null) {
    const match = url.match(new RegExp(`${key}=([^&]+)`));
    if (match !== null) {
      return decodeURI(match[1]);
    }
  }

  return null;
}
