interface ColorProps {
  colorSpanClassName: string;
  colorSwatchClassName: string;
  value: string;
}

export default function Color({ colorSpanClassName, colorSwatchClassName, value }: ColorProps) {
  return (
    <span data-color={value}>
      {colorSwatchClassName ? (
        <span className={colorSwatchClassName} style={{ backgroundColor: value }} />
      ) : null}
      {colorSpanClassName ? <span className={colorSpanClassName}>{value}</span> : value}
    </span>
  );
}
