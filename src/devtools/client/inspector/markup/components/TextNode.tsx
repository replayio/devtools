import { assert } from "protocol/utils";
import React, { PureComponent } from "react";
const { COMMENT_NODE } = require("devtools/shared/dom-node-constants");

const { getFormatStr } = require("../utils/l10n");

interface TextNodeProps {
  type: number;
  value: string | undefined;
}

class TextNode extends PureComponent<TextNodeProps> {
  render() {
    const { type, value } = this.props;
    assert(typeof value === "string");
    const isComment = type === COMMENT_NODE;
    const isWhiteSpace = !/[^\s]/.exec(value);

    return (
      <span className={"editor" + (isComment ? " comment" : " text ")}>
        {isComment ? <span>{"<!--"}</span> : null}
        <pre
          className={isWhiteSpace ? "whitespace" : ""}
          style={{
            display: "inline-block",
            whiteSpace: "normal",
          }}
          tabIndex={-1}
          title={
            isWhiteSpace
              ? getFormatStr(
                  "markupView.whitespaceOnly",
                  value.replace(/\n/g, "⏎").replace(/\t/g, "⇥").replace(/ /g, "◦")
                )
              : ""
          }
          data-label="whitespace"
        >
          {value}
        </pre>
        {isComment ? <span>{"-->"}</span> : null}
      </span>
    );
  }
}

export default TextNode;
