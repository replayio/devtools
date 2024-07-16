import { ReactNode, useContext } from "react";

import { SupportContext, SupportFormContext } from "replay-next/components/errors/SupportContext";
import Icon from "replay-next/components/Icon";

import styles from "./ReportProblemLink.module.css";

export function ReportProblemLink({
  className = "",
  context,
  onClick: onClickProp = noop,
  promptText = "Please share any additional information that may be helpful",
  title = "Report a problem",
}: {
  className?: string;
  context: SupportFormContext;
  onClick?: () => void;
  promptText?: string;
  title?: ReactNode;
}) {
  const { showSupportForm } = useContext(SupportContext);

  const onClick = () => {
    showSupportForm({
      context,
      promptText,
      title,
    });

    onClickProp();
  };

  return (
    <div className={`${styles.Flex} ${className}`} onClick={onClick}>
      <Icon className={styles.Icon} type="report-problem" />
      <div className={styles.Link}>Report a problem</div>
    </div>
  );
}

function noop() {}
