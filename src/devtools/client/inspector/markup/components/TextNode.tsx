import React, { PureComponent } from "react";

import NodeConstants from "devtools/shared/dom-node-constants";
import { assert } from "protocol/utils";
import { reIsNotWhiteSpace } from "ui/suspense/nodeCaches";

interface TextNodeProps {
  type: number;
  value: string | undefined;
}

class TextNode extends PureComponent<TextNodeProps> {
  render() {
    const { type, value } = this.props;
    assert(typeof value === "string", "value not set in TextNode props");
    const isComment = type === NodeConstants.COMMENT_NODE;
    const isWhiteSpace = !reIsNotWhiteSpace.exec(value);

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
              ? `Whitespace-only text node: ${value
                  .replace(/\n/g, "⏎")
                  .replace(/\t/g, "⇥")
                  .replace(/ /g, "◦")}`
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
