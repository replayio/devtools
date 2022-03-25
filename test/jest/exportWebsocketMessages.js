const fs = require("fs");

function processHar(harPath) {
  const jsonString = fs.readFileSync(harPath, { encoding: "utf8" });
  const harContents = JSON.parse(jsonString);

  const replayWebsocketEntry = harContents.log.entries.find(entry => {
    return entry._resourceType === "websocket" && entry.request.url === "wss://dispatch.replay.io/";
  });

  if (!replayWebsocketEntry) {
    console.error("Couldn't find a Replay websocket entry!");
    process.exit(1);
  }

  const { _webSocketMessages: messages = [] } = replayWebsocketEntry;

  console.log("Found replay entry. messages: ", messages.length);

  const receivedMessages = messages.filter(message => {
    if (message.type !== "receive") {
      return false;
    }

    // Ignore messages that are empty or have large irrelevant contents
    if (
      message.data.includes('"result":{}') ||
      message.data.includes("Network.requests") ||
      message.data.includes("image/jpeg")
    ) {
      return false;
    }

    return true;
  });

  console.log("Matching messages: ", receivedMessages.length);

  fs.writeFileSync("./websocketMessages.json", JSON.stringify(receivedMessages));
}

function main() {
  const [node, script, harPath] = process.argv;

  if (typeof harPath !== "string" || !harPath.endsWith(".har" || !fs.existsSync(harPath))) {
    console.log("Must provide a valid path to a .har file");
    process.exit(1);
  }

  processHar(harPath);
}

main();
