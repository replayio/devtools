import KeyShortcuts from "devtools/client/shared/key-shortcuts";
import { createContext } from "react";

const ShortcutsContext = createContext<KeyShortcuts | null>(null);

export default ShortcutsContext;
