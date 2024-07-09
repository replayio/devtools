import { useNag } from "replay-next/src/hooks/useNag";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { Nag } from "ui/hooks/users";

import styles from "./NewSourceNag.module.css";

export default function NewSourceNag() {
  const [showAddPrintStatementNag] = useNag(Nag.FIRST_PRINT_STATEMENT_ADD);
  const [showEditPrintStatementNag] = useNag(Nag.FIRST_PRINT_STATEMENT_EDIT);
  const [showConsoleNavigate] = useNag(Nag.FIRST_CONSOLE_NAVIGATE);

  if (!showAddPrintStatementNag && !showEditPrintStatementNag) {
    return null;
  }

  return (
    <>
      {!showConsoleNavigate ? (
        <div className={styles.Nag}>
          <MaterialIcon iconSize="xl">auto_awesome</MaterialIcon>
          {showAddPrintStatementNag
            ? "Now hover on a line number"
            : "Now edit your print statement"}
        </div>
      ) : null}
    </>
  );
}
