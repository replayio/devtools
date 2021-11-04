import classNames from "classnames";
import "./NetworkMonitor.module.css";

type StatusFamily = "SUCCESS" | "FAILURE" | "IGNORED";

type StatusProps = {
  family: StatusFamily;
  status: number;
};

const FAMILY_CLASSES: Record<StatusFamily, string> = {
  SUCCESS: "success shadow",
  FAILURE: "failure shadow",
  IGNORED: "ignored",
};

const Status = ({ family, status }: StatusProps) => {
  return (
    <div
      className={classNames(
        "status font-semibold inline-block rounded-md  p-1",
        FAMILY_CLASSES[family]
      )}
    >
      {status}
    </div>
  );
};

export default Status;
