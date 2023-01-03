import { useFeature } from "ui/hooks/settings";

import { ConsoleNag } from "../shared/Nags/Nags";

import NewConsole from "replay-next/components/console";

// Adapter that connects the legacy app Redux stores to the newer React Context providers.
export default function NewConsoleRoot() {
  const { value: consoleFilterDrawerDefaultsToOpen } = useFeature(
    "consoleFilterDrawerDefaultsToOpen"
  );

  return (
    <NewConsole
      nagHeader={<ConsoleNag />}
      showFiltersByDefault={consoleFilterDrawerDefaultsToOpen}
      showSearchInputByDefault={false}
    />
  );
}
