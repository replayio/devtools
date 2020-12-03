import { PseudoClass } from "devtools/shared/css/constants";

export interface PseudoClassState {
  isChecked: boolean;
  isDisabled: boolean;
}

export type PseudoClassesState = Record<PseudoClass, PseudoClassState>;
