import Breakpoints from "./Breakpoints";

export default function BreakpointsPane() {
  return (
    <Breakpoints
      emptyContent="Click on a line number in the editor to add a breakpoint"
      type="breakpoint"
    />
  );
}
