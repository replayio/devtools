import NewConsole from "replay-next/components/console";
import { usePreference } from "shared/preferences/usePreference";

import { ConsoleNag } from "../shared/Nags/Nags";

// Adapter that connects the legacy app Redux stores to the newer React Context providers.
export default function NewConsoleRoot() {
  const [consoleFilterDrawerDefaultsToOpen] = usePreference("consoleFilterDrawerDefaultsToOpen");

  return (
    <NewConsole
      nagHeader={<ConsoleNag />}
      showFiltersByDefault={consoleFilterDrawerDefaultsToOpen}
      showSearchInputByDefault={false}
    />
  );
}
