import renderer from 'react-test-renderer';
import SyntaxHighlightedLine from "./SyntaxHighlightedLine";

const SNIPPET = 'button.addEventListener("click", () => onClick(button, index + 1));';
const SNIPPET_TOKENS = [
  { columnIndex: 4, types: ["variableName"], value: "button" },
  { columnIndex: 10, types: ["operator"], value: "." },
  { columnIndex: 11, types: ["propertyName"], value: "addEventListener" },
  { columnIndex: 27, types: ["punctuation"], value: "(" },
  { columnIndex: 28, types: ["string"], value: '"click"' },
  { columnIndex: 35, types: ["punctuation"], value: "," },
  { columnIndex: 36, types: null, value: " " },
  { columnIndex: 37, types: ["punctuation"], value: "(" },
  { columnIndex: 38, types: ["punctuation"], value: ")" },
  { columnIndex: 39, types: null, value: " " },
  { columnIndex: 40, types: ["punctuation"], value: "=>" },
  { columnIndex: 42, types: null, value: " " },
  { columnIndex: 43, types: ["variableName"], value: "onClick" },
  { columnIndex: 50, types: ["punctuation"], value: "(" },
  { columnIndex: 51, types: ["variableName"], value: "button" },
  { columnIndex: 57, types: ["punctuation"], value: "," },
  { columnIndex: 58, types: null, value: " " },
  { columnIndex: 59, types: ["variableName"], value: "index" },
  { columnIndex: 64, types: null, value: " " },
  { columnIndex: 65, types: ["operator"], value: "+" },
  { columnIndex: 66, types: null, value: " " },
  { columnIndex: 67, types: ["number"], value: "1" },
  { columnIndex: 68, types: ["punctuation"], value: ")" },
  { columnIndex: 69, types: ["punctuation"], value: ")" },
  { columnIndex: 70, types: ["punctuation"], value: ";" },
];

describe("syntax-highlighting", () => {
  it("syntax highliting should work without passing tokens to SyntaxHighlitedLine", async () => {
    const tree = renderer.create(<SyntaxHighlightedLine code={SNIPPET} />).toJSON()
    expect(tree).toMatchSnapshot();
  });

  it("syntax highliting should work when tokens are passed to SyntaxHighlitedLine", async () => {
    const tree = renderer.create(<SyntaxHighlightedLine code={SNIPPET} tokens={SNIPPET_TOKENS} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
