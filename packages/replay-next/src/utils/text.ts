export function isNumeric(text: string): boolean {
  return (
    typeof text === "string" &&
    text.match(/\s/) === null &&
    !isNaN(text as any) &&
    !isNaN(parseFloat(text))
  );
}

export function truncate(
  text: string,
  options: {
    maxLength: number;
    position?: "start" | "end" | "middle";
    truncationMarker?: string;
  }
) {
  const { maxLength, position = "end", truncationMarker = "…" } = options;

  if (text.length <= maxLength) {
    return text;
  }

  const effectiveMaxLength = maxLength - truncationMarker.length;

  switch (position) {
    case "start":
      return `${truncationMarker}${text.substring(text.length - effectiveMaxLength)}`;
      break;
    case "middle":
      const startString = text.substring(0, Math.ceil(effectiveMaxLength / 2));
      const endString = text.substring(text.length - Math.floor(effectiveMaxLength / 2));

      return `${startString}${truncationMarker}${endString}`;
      break;
    case "end":
    default:
      return `${text.substring(0, effectiveMaxLength)}${truncationMarker}`;
      break;
  }
}
