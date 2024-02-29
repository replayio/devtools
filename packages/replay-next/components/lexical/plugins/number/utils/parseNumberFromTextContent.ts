export function parseNumberFromTextContent({
  defaultValue,
  maxValue,
  minValue,
  step,
  textContent,
}: {
  defaultValue: number;
  maxValue?: number;
  minValue?: number;
  step: number;
  textContent: string;
}) {
  const maybeNumber =
    Math.round(step) === step ? parseInt(textContent, 10) : parseFloat(textContent);

  let number: number;
  if (maybeNumber == null || isNaN(maybeNumber)) {
    number = minValue ?? maxValue ?? defaultValue;
  } else {
    number = maybeNumber;
  }

  if (minValue != null && number < minValue) {
    number = minValue;
  } else if (maxValue != null && number > maxValue) {
    number = maxValue;
  }

  return number;
}
