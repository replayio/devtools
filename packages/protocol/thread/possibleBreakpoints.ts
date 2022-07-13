import { Location, SameLineSourceLocations } from "@replayio/protocol";
// eslint-disable-next-line
import { client } from "protocol/socket";
import { ThreadFront } from "./thread";

export const fetchProtocolPossibleBreakpoints = async (
  sourceId: string,
  range?: { start: Location; end: Location }
): Promise<SameLineSourceLocations[]> => {
  const begin = range ? range.start : undefined;
  const end = range ? range.end : undefined;
  const sessionId = await ThreadFront.waitForSession();
  const { lineLocations } = await client.Debugger.getPossibleBreakpoints(
    { sourceId, begin, end },
    sessionId
  );
  return lineLocations;
};

export const sameLineSourceLocationsToLocationList = (
  sameLineLocations: SameLineSourceLocations[],
  sourceId: string
): Location[] => {
  return sameLineLocations.flatMap(lineLocations => {
    return lineLocations.columns.map(column => {
      return {
        line: lineLocations.line,
        column,
        sourceId,
      };
    });
  });
};
