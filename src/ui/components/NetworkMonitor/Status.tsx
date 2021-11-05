import classNames from "classnames/bind";
import css from "./Status.module.css";
const cx = classNames.bind(css);

type StatusFamily = "SUCCESS" | "FAILURE" | "IGNORED";

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
  throw `Don't know how to compute a status family for status: ${status}`;
};

const FAMILY_CLASSES: Record<StatusFamily, string> = {
  SUCCESS: "success shadow",
  FAILURE: "failure shadow",
  IGNORED: "ignored",
};

const Status = ({ value }: StatusProps) => {
  const family = familyFor(value);
  const familyClass = FAMILY_CLASSES[family];
  return (
    <div className={cx("status font-semibold inline-block rounded-md  p-1", familyClass)}>
      {value}
    </div>
  );
};

export default Status;
