import { ObjectId, ObjectPreviewLevel, PauseData, PauseId, SessionId } from "@replayio/protocol";
import { Deferred, createDeferred } from "suspense";

// eslint-disable-next-line no-restricted-imports
import { client } from "protocol/socket";

type Request = {
  objectId: ObjectId;
  deferred: Deferred<PauseData>;
};

const BATCH_DELAY_MS = 250;

const queuedRequests: Map<string, [NodeJS.Timeout, Request[]]> = new Map();

export async function batchedGetObjectPreview(
  sessionId: SessionId,
  objectId: ObjectId,
  pauseId: PauseId,
  level?: ObjectPreviewLevel
): Promise<PauseData> {
  const deferred = createDeferred<PauseData>(
    `getObjectPreview: (objectId: ${objectId}, pauseId: ${pauseId}, level: ${level})`
  );

  batchRequestsForPauseAndLevel(sessionId, objectId, pauseId, level, deferred);

  return deferred.promise;
}

async function getObjectPreviews(
  sessionId: SessionId,
  pauseId: PauseId,
  level: ObjectPreviewLevel | undefined,
  requests: Request[]
): Promise<void> {
  const objectIds: ObjectId[] = [];
  const objectIdToDeferred = new Map<ObjectId, Deferred<PauseData>>();

  requests.forEach(({ deferred, objectId }) => {
    objectIds.push(objectId);
    objectIdToDeferred.set(objectId, deferred);
  });

  const { data } = await client.Pause.getObjectPreviews(
    { level, objects: objectIds },
    sessionId,
    pauseId || undefined
  );

  data.objects?.forEach(object => {
    const deferred = objectIdToDeferred.get(object.objectId);
    if (deferred) {
      deferred.resolve({
        objects: [object],
      });
    }
  });

  // PauseData is only returned once for any given object and pause
  // It's possible that some of the objects requested have already been returned
  // but we still need to resolve their hanging promises
  objectIdToDeferred.forEach(deferred => {
    try {
      deferred.resolve({
        objects: [],
      });
    } catch (error) {
      // TODO Add status to Deferred so we can avoid this
    }
  });
}

function batchRequestsForPauseAndLevel(
  sessionId: SessionId,
  objectId: ObjectId,
  pauseId: PauseId,
  level: ObjectPreviewLevel | undefined,
  deferred: Deferred<PauseData>
) {
  const key = getKey(pauseId, level);

  const request: Request = {
    deferred,
    objectId,
  };

  const match = queuedRequests.get(key);
  if (match) {
    const [timeoutId, requests] = match;
    requests.push(request);

    // Server limit
    if (requests.length === 250) {
      clearTimeout(timeoutId);

      queuedRequests.delete(key);

      getObjectPreviews(sessionId, pauseId, level, requests);
    }
  } else {
    const requests: Request[] = [request];

    const timeoutId = setTimeout(() => {
      queuedRequests.delete(key);

      getObjectPreviews(sessionId, pauseId, level, requests);
    }, BATCH_DELAY_MS);

    queuedRequests.set(key, [timeoutId, requests]);
  }
}

function getKey(pauseId: PauseId, level?: ObjectPreviewLevel) {
  return `${pauseId}:${level ?? ""}`;
}
