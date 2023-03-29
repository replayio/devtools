import { ParsedToken } from "replay-next/src/utils/syntax-parser";

export function formatExpressionToken(parsedToken: ParsedToken): ParsedToken {
  if (parsedToken.types == null || !parsedToken.types.includes("string")) {
    return parsedToken;
  }

  const text = parsedToken.value;

  let wrapperType;
  switch (text.charAt(0)) {
    case "`":
      wrapperType = "backtick";
      break;
    case '"':
      wrapperType = "doubleQuote";
      break;
    case "'":
      wrapperType = "singleQuote";
      break;
    default:
      return parsedToken;
  }

  const textWithoutWrappers = text.slice(1, -1);

  let backtickCount = 0;
  let doubleQuoteCount = 0;
  let singleQuoteCount = 0;

  let containsPossibleExpression = false;
  let maybeStartOfExpression = false;

  for (let index = 0; index < textWithoutWrappers.length; index++) {
    const character = textWithoutWrappers.charAt(index);
    switch (character) {
      case "`":
        backtickCount++;
        break;
      case '"':
        doubleQuoteCount++;
        break;
      case "'":
        singleQuoteCount++;
        break;
      case "{":
        if (maybeStartOfExpression) {
          containsPossibleExpression = true;
        }
        break;
    }

    maybeStartOfExpression = character === "$";
  }

  switch (wrapperType) {
    case "backtick": {
      if (containsPossibleExpression || backtickCount === 0) {
        return { ...parsedToken, value: text };
      }
      break;
    }
    case "doubleQuote": {
      if (doubleQuoteCount === 0) {
        return { ...parsedToken, value: text };
      }
      break;
    }
    case "singleQuote": {
      if (singleQuoteCount === 0) {
        return { ...parsedToken, value: text };
      }
      break;
    }
  }

  if (singleQuoteCount === 0) {
    const sanitizedText = textWithoutWrappers.replace(/\\(["`])/g, "$1");
    return { ...parsedToken, value: `'${sanitizedText}'` };
  } else if (doubleQuoteCount === 0) {
    const sanitizedText = textWithoutWrappers.replace(/\\(['`])/g, "$1");
    return { ...parsedToken, value: `"${sanitizedText}"` };
  } else if (backtickCount === 0) {
    const sanitizedText = textWithoutWrappers.replace(/\\(['"])/g, "$1");
    return { ...parsedToken, value: "`" + sanitizedText + "`" };
  }

  return parsedToken;
}
