import classNames from "classnames";
import styles from "./Status.module.css";

type StatusFamily = "SUCCESS" | "FAILURE" | "IGNORED" | "INFO";

type StatusProps = {
  value: number;
};

const familyFor = (status: number): StatusFamily => {
  if (status >= 500) {
    return "FAILURE";
  }
  if (status >= 400) {
    return "FAILURE";
  }
  if (status >= 300) {
    return "IGNORED";
  }
  if (status >= 200) {
    return "SUCCESS";
  }
  if (status >= 100) {
    return "INFO";
  }
  return null as never;

  throw `Don't know how to compute a status family for status: ${status}`;
};

const FAMILY_CLASSES: Record<StatusFamily, string[]> = {
  SUCCESS: ["success", "shadow"],
  FAILURE: ["failure", "shadow"],
  IGNORED: ["ignored"],
  INFO: ["ignored"],
};

const Status = ({ value }: StatusProps) => {
  const family = familyFor(value);
  const familyClass = FAMILY_CLASSES[family];
  return (
    <div
      className={classNames(
        "status font-semibold inline-block rounded-md  p-1",
        familyClass.map(c => styles[c])
      )}
    >
      {value}
    </div>
  );
};

export default Status;
