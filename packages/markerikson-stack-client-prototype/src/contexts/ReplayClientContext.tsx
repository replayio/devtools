import { createContext } from "react";
import { replayClient, ReplayClientInterface } from "../client/ReplayClient";

export type ReplayClientContextType = ReplayClientInterface;

export const ReplayClientContext = createContext<ReplayClientContextType>(replayClient);
