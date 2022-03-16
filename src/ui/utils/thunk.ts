import type { clientCommands } from "devtools/client/debugger/src/client/commands";

export interface ThunkExtraArgs {
  client: typeof clientCommands;
}
