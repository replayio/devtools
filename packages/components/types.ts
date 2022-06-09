/** Spacing values that map to Tailwind gap and padding class names. */
export type SpacingValues =
  | 0
  | 0.5
  | 1
  | 1.5
  | 2
  | 2.5
  | 3
  | 3.5
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 14
  | 16
  | 20
  | 24
  | 28
  | 32
  | 36
  | 40
  | 44
  | 48
  | 52
  | 56
  | 60
  | 64
  | 72
  | 80
  | 96;

export type SpacingProps = {
  /** Control space between children. */
  gap?: SpacingValues;

  /** Control space around children. */
  padding?: SpacingValues;

  /** Control the top inner space. */
  paddingTop?: SpacingValues;

  /** Control the right inner space. */
  paddingRight?: SpacingValues;

  /** Control the bottom inner space. */
  paddingBottom?: SpacingValues;

  /** Control the left inner space. */
  paddingLeft?: SpacingValues;

  /** Control the left and right inner space. */
  paddingHorizontal?: SpacingValues;

  /** Control the top and bottom inner space. */
  paddingVertical?: SpacingValues;
};
