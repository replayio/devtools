const React = require("react");
const PropTypes = require("prop-types");
const { COLOR, FONT_FAMILY, URI } = require("devtools/client/shared/output-parser");

const Color = require("devtools/client/inspector/rules/components/value/Color");
const FontFamily = require("devtools/client/inspector/rules/components/value/FontFamily");
const Url = require("devtools/client/inspector/rules/components/value/Url");

class DeclarationValue extends React.PureComponent {
  static get propTypes() {
    return {
      colorSpanClassName: PropTypes.string,
      colorSwatchClassName: PropTypes.string,
      fontFamilySpanClassName: PropTypes.string,
      values: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object]))
        .isRequired,
    };
  }

  render() {
    return this.props.values.map(v => {
      if (typeof v === "string") {
        return v;
      }

      const { type, value } = v;

      switch (type) {
        case COLOR:
          return React.createElement(Color, {
            colorSpanClassName: this.props.colorSpanClassName,
            colorSwatchClassName: this.props.colorSwatchClassName,
            key: value,
            value,
          });
        case FONT_FAMILY:
          return React.createElement(FontFamily, {
            fontFamilySpanClassName: this.props.fontFamilySpanClassName,
            key: value,
            value,
          });
        case URI:
          return React.createElement(Url, {
            key: value,
            href: v.href,
            value,
          });
      }

      return value;
    });
  }
}

module.exports = DeclarationValue;
