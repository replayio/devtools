const { PureComponent } = require("react");
const dom = require("react-dom-factories");
const PropTypes = require("prop-types");
const { COMMENT_NODE } = require("devtools/shared/dom-node-constants");

const { getStr, getFormatStr } = require("../utils/l10n");

class TextNode extends PureComponent {
  static get propTypes() {
    return {
      type: PropTypes.number.isRequired,
      value: PropTypes.string.isRequired,
    };
  }

  render() {
    const { type, value } = this.props;
    const isComment = type === COMMENT_NODE;
    const isWhiteSpace = !/[^\s]/.exec(value);

    return dom.span(
      { className: "editor" + (isComment ? " comment" : " text ") },
      isComment ? dom.span({}, "<!--") : null,
      dom.pre(
        {
          className: isWhiteSpace ? "whitespace" : "",
          style: {
            display: "inline-block",
            whiteSpace: "normal",
          },
          tabIndex: -1,
          title: isWhiteSpace
            ? getFormatStr(
                "markupView.whitespaceOnly",
                value.replace(/\n/g, "⏎").replace(/\t/g, "⇥").replace(/ /g, "◦")
              )
            : "",
          "data-label": getStr("markupView.whitespaceOnly.label"),
        },
        value
      ),
      isComment ? dom.span({}, "-->") : null
    );
  }
}

module.exports = TextNode;
