import { connect } from "react-redux";
import SmartTrace from "devtools/client/shared/components/SmartTrace";
import { onViewSourceInDebugger } from "../actions";

export default connect(null, {
  onViewSourceInDebugger,
  // @ts-expect-error some nested field mismatch
})(SmartTrace);
