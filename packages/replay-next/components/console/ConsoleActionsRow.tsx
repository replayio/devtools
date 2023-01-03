import Icon from "replay-next/components/Icon";

import styles from "./ConsoleActionsRow.module.css";

export default function ConsoleActionsRow({
  clearConsoleEvaluations,
  consoleEvaluationsCount,
  isMenuOpen,
  setIsMenuOpen,
  setMenuValueHasBeenToggled,
}: {
  clearConsoleEvaluations: () => void;
  consoleEvaluationsCount: Number;
  isMenuOpen: boolean;
  setIsMenuOpen: (value: boolean) => void;
  setMenuValueHasBeenToggled: (value: boolean) => void;
}) {
  return (
    <div className={styles.ConsoleActions}>
      <button
        className={styles.MenuToggleButton}
        data-test-id="ConsoleMenuToggleButton"
        data-test-state={isMenuOpen ? "open" : "closed"}
        onClick={() => {
          setIsMenuOpen(!isMenuOpen);
          setMenuValueHasBeenToggled(true);
        }}
        title={isMenuOpen ? "Close filter menu" : "Open filter menu"}
      >
        <Icon
          className={styles.MenuToggleButtonIcon}
          type={isMenuOpen ? "menu-open" : "menu-closed"}
        />
      </button>

      {consoleEvaluationsCount > 0 && (
        <button
          className={styles.DeleteTerminalExpressionButton}
          data-test-id="ClearConsoleEvaluationsButton"
          onClick={clearConsoleEvaluations}
          title="Clear console evaluations"
        >
          <Icon className={styles.DeleteTerminalExpressionIcon} type="delete" />
        </button>
      )}
    </div>
  );
}
