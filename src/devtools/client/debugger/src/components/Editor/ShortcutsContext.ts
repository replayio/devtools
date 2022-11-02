import { createContext } from "react";

import KeyShortcuts from "devtools/client/shared/key-shortcuts";

const ShortcutsContext = createContext<KeyShortcuts | null>(null);

export default ShortcutsContext;
