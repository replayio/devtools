import NewConsole from "replay-next/components/console";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";

import { ConsoleNag } from "../shared/Nags/Nags";

// Adapter that connects the legacy app Redux stores to the newer React Context providers.
export default function NewConsoleRoot() {
  console.log("Rendering NewConsoleRoot");
  const [consoleFilterDrawerDefaultsToOpen] = useGraphQLUserData("console_showFiltersByDefault");

  return (
    <NewConsole
      nagHeader={<ConsoleNag />}
      showFiltersByDefault={consoleFilterDrawerDefaultsToOpen}
      showSearchInputByDefault={false}
    />
  );
}
