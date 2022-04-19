const PropTypes = require("prop-types");
const { PureComponent } = require("react");
const dom = require("react-dom-factories");

class Url extends PureComponent {
  static get propTypes() {
    return {
      href: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    };
  }

  render() {
    return dom.a(
      {
        className: "theme-link",
        href: this.props.href,
        target: "_blank",
      },
      this.props.value
    );
  }
}

module.exports = Url;
