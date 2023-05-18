import { Location, MappedLocation, SourceId } from "@replayio/protocol";

import { assert } from "protocol/utils";

import { Source } from "../suspense/SourcesCache";

export function shouldSourceBeDisplayed(source: Source): boolean {
  return source.kind !== "inlineScript";
}

export function getCorrespondingSourceIds(
  sourcesById: Map<SourceId, Source>,
  sourceId: SourceId
): SourceId[] {
  const source = sourcesById.get(sourceId);
  // TODO [hbenl] disabled for now because the sources we receive from the backend
  // are incomplete for node recordings, see RUN-508
  // assert(source, `unknown source ${id}`);
  return source?.correspondingSourceIds ?? [sourceId];
}

export function getCorrespondingLocations(
  sourcesById: Map<SourceId, Source>,
  location: Location
): Location[] {
  const { column, line, sourceId } = location;
  const sourceIds = getCorrespondingSourceIds(sourcesById, sourceId);
  return sourceIds.map(sourceId => ({
    column,
    line,
    sourceId,
  }));
}

export function getBestSourceMappedSourceId(
  sourcesById: Map<SourceId, Source>,
  sourceIds: SourceId[]
) {
  const sourceIdSet = new Set(sourceIds);
  return sourceIds.find(sourceId => {
    const source = sourcesById.get(sourceId);
    assert(source, `unknown source ${sourceId}`);
    return (
      source.isSourceMapped && !source.generatedFrom.some(originalId => sourceIdSet.has(originalId))
    );
  });
}

export function getBestNonSourceMappedSourceId(
  sourcesById: Map<SourceId, Source>,
  sourceIds: SourceId[]
) {
  const sourceIdSet = new Set(sourceIds);
  return sourceIds.find(sourceId => {
    const source = sourcesById.get(sourceId);
    assert(source, `unknown source ${sourceId}`);
    return (
      !source.isSourceMapped &&
      !source.generatedFrom.some(originalId => sourceIdSet.has(originalId))
    );
  });
}

export function getPreferredSourceId(
  sourcesById: Map<SourceId, Source>,
  sourceIds: string[],
  preferredGeneratedSourceIds?: SourceId[]
) {
  const sourceMappedId = getBestSourceMappedSourceId(sourcesById, sourceIds);
  const nonSourceMappedId = getBestNonSourceMappedSourceId(sourcesById, sourceIds);
  if (!sourceMappedId) {
    return nonSourceMappedId;
  }
  if (!nonSourceMappedId) {
    return sourceMappedId;
  }
  if (preferredGeneratedSourceIds?.includes(nonSourceMappedId)) {
    return nonSourceMappedId;
  }
  return sourceMappedId;
}

// Given an RRP MappedLocation array with locations in different sources
// representing the same generated location (i.e. a generated location plus
// all the corresponding locations in original or pretty printed sources etc.),
// choose the location which we should be using within the devtools. Normally
// this is the most original location, except when preferSource has been used
// to prefer a generated source instead.
export function getPreferredLocation(
  sourcesById: Map<SourceId, Source>,
  preferredGeneratedSourceIds: SourceId[],
  locations: MappedLocation
) {
  const sourceId = getPreferredSourceId(
    sourcesById,
    locations.map(l => l.sourceId),
    preferredGeneratedSourceIds
  );
  const preferredLocation = locations.find(l => l.sourceId == sourceId);
  assert(preferredLocation, "no preferred location found");

  const preferredSource = sourcesById.get(preferredLocation.sourceId);
  assert(preferredSource, `unknown source ${preferredLocation.sourceId}`);
  assert(
    preferredLocation.sourceId === preferredSource.correspondingSourceIds[0],
    `location.sourceId should be updated to the first corresponding sourceId: ${JSON.stringify({
      preferredLocation,
      correspondingSourceIds: preferredSource.correspondingSourceIds,
    })}`
  );
  return preferredLocation;
}

export function getPreferredLocationWorkaround(
  sourcesById: Map<SourceId, Source>,
  preferredGeneratedSourceIds: SourceId[],
  locations: MappedLocation
) {
  // TODO [FE-1508] another hack: the new console doesn't update sourceIds in locations
  // to their first corresponding sourceId, which getPreferredLocation
  // subsequently complains about
  const correspondingLocations = locations.map(location => ({
    ...location,
    sourceId: getCorrespondingSourceIds(sourcesById, location.sourceId)[0],
  }));
  return getPreferredLocation(sourcesById, preferredGeneratedSourceIds, correspondingLocations);
}

export function getAlternateSourceId(
  sourcesById: Map<SourceId, Source>,
  sourceIds: SourceId[],
  preferredGeneratedSources?: SourceId[]
) {
  const sourceMappedId = getBestSourceMappedSourceId(sourcesById, sourceIds);
  const nonSourceMappedId = getBestNonSourceMappedSourceId(sourcesById, sourceIds);
  if (!sourceMappedId || !nonSourceMappedId) {
    return;
  }
  if (preferredGeneratedSources?.includes(nonSourceMappedId)) {
    return sourceMappedId;
  }
  return nonSourceMappedId;
}

export function getAlternateLocation(
  sourcesById: Map<SourceId, Source>,
  preferredGeneratedSourceIds: SourceId[],
  locations: MappedLocation
) {
  const alternateId = getAlternateSourceId(
    sourcesById,
    locations.map(l => l.sourceId),
    preferredGeneratedSourceIds
  );
  if (alternateId) {
    return locations.find(l => l.sourceId == alternateId);
  }
  return null;
}

export function getGeneratedLocation(
  sourcesById: Map<SourceId, Source>,
  locations: MappedLocation
): Location {
  const location = locations.find(location => {
    const source = sourcesById.get(location.sourceId);
    return source?.generated.length === 0;
  });
  assert(location, "no generated location found");
  return location || locations[0];
}
