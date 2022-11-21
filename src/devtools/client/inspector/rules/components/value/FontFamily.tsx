interface FFProps {
  fontFamilySpanClassName: string;
  value: string;
}

export default function FontFamily({ fontFamilySpanClassName, value }: FFProps) {
  return <span className={fontFamilySpanClassName}>{value}</span>;
}
