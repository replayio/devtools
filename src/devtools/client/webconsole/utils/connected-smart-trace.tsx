import SmartTrace from "devtools/client/shared/components/SmartTrace";
import { connect } from "react-redux";
import { actions } from "ui/actions";

export default connect(null, {
  onViewSourceInDebugger: actions.onViewSourceInDebugger,
})(SmartTrace);
