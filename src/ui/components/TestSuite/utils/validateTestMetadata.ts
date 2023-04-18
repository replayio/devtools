import assert from "assert";

import { Recording, TestMetadata } from "shared/graphql/types";

export default function validateTestMetadata(recording: Recording): TestMetadata {
  const recordingMetadata = recording.metadata;
  assert(recordingMetadata != null, "Recording metadata not found");

  const testMetadata = recordingMetadata.test;
  assert(testMetadata != null, "Test metadata not found");

  return testMetadata;
}
