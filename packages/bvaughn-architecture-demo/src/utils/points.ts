import { Point } from "@bvaughn/src/contexts/PointsContext";

export function doesPointrequiresAnalysis(point: Point): boolean {
  try {
    runLocalAnalysis(point.content);
    return true;
  } catch (error) {
    return false;
  }
}

export function runLocalAnalysis(text: string): any {
  const getter = new Function(`return [${text}];`);
  return getter();
}
