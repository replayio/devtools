const { PureComponent } = require("react");
const dom = require("react-dom-factories");
const { connect } = require("react-redux");

class MarkupApp extends PureComponent {
  static get propTypes() {
    return {};
  }

  render() {
    return dom.div({
      id: "markup-container",
    });
  }
}

module.exports = connect(state => state)(MarkupApp);
