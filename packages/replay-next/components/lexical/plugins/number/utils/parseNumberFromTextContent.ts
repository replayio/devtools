export function parseNumberFromTextContent({
  maxValue,
  minValue,
  step,
  textContent,
}: {
  maxValue?: number;
  minValue?: number;
  step: number;
  textContent: string;
}): number | undefined {
  const maybeNumber =
    Math.round(step) === step ? parseInt(textContent, 10) : parseFloat(textContent);

  let number: number | undefined;
  if (!isNaN(maybeNumber)) {
    number = maybeNumber;

    if (minValue != null && number < minValue) {
      number = minValue;
    } else if (maxValue != null && number > maxValue) {
      number = maxValue;
    }
  }

  return number;
}
