const { PureComponent } = require("react");
const dom = require("react-dom-factories");
const PropTypes = require("prop-types");

class FontFamily extends PureComponent {
  static get propTypes() {
    return {
      fontFamilySpanClassName: PropTypes.string,
      value: PropTypes.string.isRequired,
    };
  }

  render() {
    const { fontFamilySpanClassName, value } = this.props;
    return dom.span({ className: fontFamilySpanClassName }, value);
  }
}

module.exports = FontFamily;
