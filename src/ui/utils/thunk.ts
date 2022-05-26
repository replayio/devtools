import type { clientCommands } from "devtools/client/debugger/src/client/commands";
import type { ThreadFront } from "protocol/thread";

export interface ThunkExtraArgs {
  client: typeof clientCommands;
  ThreadFront: typeof ThreadFront;
}
