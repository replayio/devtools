import styles from "./TestRunLibraryRow.module.css";

export function TestRunLibraryRow({
  isSelected,
  className,
  ...rest
}: { isSelected?: boolean } & React.HTMLProps<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-row items-center rounded-lg ${styles.libraryRow} ${
        isSelected ? styles.libraryRowSelected : ""
      } ${className ?? ""}`}
      data-selected={isSelected || undefined}
      {...rest}
    />
  );
}
