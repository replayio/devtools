import createPlayer from "shared/proxy/createPlayer";
import { Entry } from "shared/proxy/types";

import { ReplayClientInterface } from "./types";

export default function createReplayClientPlayer(entries: Entry[]): ReplayClientInterface {
  return createPlayer<ReplayClientInterface>(entries);
}
