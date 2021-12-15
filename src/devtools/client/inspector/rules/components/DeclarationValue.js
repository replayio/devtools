const { createFactory, PureComponent } = require("react");
const PropTypes = require("prop-types");
const { COLOR, FONT_FAMILY, URI } = require("devtools/client/shared/output-parser");

const Color = createFactory(require("devtools/client/inspector/rules/components/value/Color"));
const FontFamily = createFactory(
  require("devtools/client/inspector/rules/components/value/FontFamily")
);
const Url = createFactory(require("devtools/client/inspector/rules/components/value/Url"));

export class DeclarationValue extends PureComponent {
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
          return Color({
            colorSpanClassName: this.props.colorSpanClassName,
            colorSwatchClassName: this.props.colorSwatchClassName,
            key: value,
            value,
          });
        case FONT_FAMILY:
          return FontFamily({
            fontFamilySpanClassName: this.props.fontFamilySpanClassName,
            key: value,
            value,
          });
        case URI:
          return Url({
            key: value,
            href: v.href,
            value,
          });
      }

      return value;
    });
  }
}
