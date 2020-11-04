const { PureComponent } = require("react");
const dom = require("react-dom-factories");
const PropTypes = require("prop-types");

class ReadOnlyNode extends PureComponent {
  static get propTypes() {
    return {
      displayName: PropTypes.string.isRequired,
      isDocType: PropTypes.bool.isRequired,
      pseudoType: PropTypes.string,
    };
  }

  render() {
    const { displayName, isDocType, pseudoType } = this.props;

    return dom.span(
      { className: "editor" + (isDocType ? " comment doctype" : "") },
      dom.span(
        {
          className: "tag" + (pseudoType ? " theme-fg-color3" : ""),
          tabIndex: isDocType ? -1 : "",
        },
        isDocType ? `<!DOCTYPE ${displayName}>` : pseudoType ? `::${pseudoType}` : displayName
      )
    );
  }
}

module.exports = ReadOnlyNode;
