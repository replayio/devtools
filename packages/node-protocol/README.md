## Replay Node Protocol

Provides a protocol client that can be used from Node.js scripts to communicate with the Replay.io backend via the [protocol](https://replay.io/protocol).

### Example usage

This script, creates a Replay client that can create a debugging session.

```js
import { createClient } from "node-protocol";

const recordingId = "889363e9-08b9-4755-904f-447549558575";

const { client } = await createClient();
const { sessionId } = await client.Recording.createSession({ recordingId });
console.log(`sessionId: ${sessionId}`);
```
