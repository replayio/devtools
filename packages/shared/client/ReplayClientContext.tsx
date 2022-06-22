import { createContext } from "react";

import { ReplayClientInterface } from "../client/ReplayClient";

export type ReplayClientContextType = ReplayClientInterface;

export const ReplayClientContext = createContext<ReplayClientContextType | null>(null);
