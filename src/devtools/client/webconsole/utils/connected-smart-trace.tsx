import { connect } from "react-redux";
const { actions } = require("ui/actions");
const SmartTrace = require("devtools/client/shared/components/SmartTrace");

export default connect(null, {
  onViewSourceInDebugger: actions.onViewSourceInDebugger,
})(SmartTrace);
