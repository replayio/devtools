import NewConsole from "replay-next/components/console";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";

import { ConsoleNag } from "../shared/Nags/Nags";

// Adapter that connects the legacy app Redux stores to the newer React Context providers.
export default function NewConsoleRoot() {
  const [consoleFilterDrawerDefaultsToOpen] = useGraphQLUserData(
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
