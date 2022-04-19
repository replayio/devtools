const PropTypes = require("prop-types");
const { PureComponent } = require("react");
const dom = require("react-dom-factories");

class Color extends PureComponent {
  static get propTypes() {
    return {
      colorSpanClassName: PropTypes.string,
      colorSwatchClassName: PropTypes.string,
      value: PropTypes.string.isRequired,
    };
  }

  render() {
    const { colorSpanClassName, colorSwatchClassName, value } = this.props;

    return dom.span(
      { "data-color": value },
      colorSwatchClassName
        ? dom.span({
            className: colorSwatchClassName,
            style: { backgroundColor: value },
          })
        : null,
      colorSpanClassName ? dom.span({ className: colorSpanClassName }, value) : value
    );
  }
}

module.exports = Color;
