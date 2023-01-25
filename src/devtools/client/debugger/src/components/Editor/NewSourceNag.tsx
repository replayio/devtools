import { useNag } from "replay-next/src/hooks/useNag";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { Nag } from "ui/hooks/users";

import styles from "./NewSourceNag.module.css";

export default function NewSourceNag() {
  const [showAddBreakpointNag] = useNag(Nag.FIRST_BREAKPOINT_ADD);
  const [showEditBreakpointNag] = useNag(Nag.FIRST_BREAKPOINT_EDIT);

  if (!showAddBreakpointNag && !showEditBreakpointNag) {
    return null;
  }

  return (
    <div className={styles.Nag}>
      <MaterialIcon iconSize="xl">auto_awesome</MaterialIcon>
      {showAddBreakpointNag ? "Now hover on a line number" : "Now edit your print statement"}
    </div>
  );
}
