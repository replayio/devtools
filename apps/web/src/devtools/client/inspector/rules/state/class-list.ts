import { ClassInfo } from "../models/class-list";

export interface ClassListState {
  /** An array of objects containing the CSS class state that is applied to the current
   * element. */
  classes: ClassInfo[];
  /** Whether or not the class list panel is expanded. */
  isClassPanelExpanded: boolean;
}
