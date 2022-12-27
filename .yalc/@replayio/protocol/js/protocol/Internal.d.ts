import { RecordingId, BuildId } from "./Recording";
/**
 * Metadata that can be associated with a recording.
 */
export interface RecordingData {
    id: RecordingId;
    url: string;
    title: string;
    duration: number;
    lastScreenData: string;
    lastScreenMimeType: string;
    operations: OperationsData;
}
/**
 * Operations that could be considered security sensitive and is
 * currently targeted at times when the recording accesses existing
 * information from the user's profile like cookies and local storage.
 */
export interface OperationsData {
    scriptDomains: string[];
    cookies?: string[];
    storage?: string[];
}
export interface createRecordingParameters {
    /**
     * Build Id of the software which produced the recording.
     */
    buildId: BuildId;
    /**
     * Identifier for the recording. Must be a version 4 UUID. If not specified,
     * a new ID will be created.
     */
    recordingId?: RecordingId;
    /**
     * The backend will accept all recording data until it gets an
     * `Internal.finishRecording` command or the connection closes. Partial
     * recordings can be useful for debugging, but if data integrity
     * is important, this option can be used to avoid ending up with a
     * partially-created recording.
     * With this flag enabled, a connection loss during upload will
     * invalidate the recording rather than using the partially-complete data.
     */
    requireFinish?: boolean;
}
export interface createRecordingResult {
    /**
     * Identifier for the recording. Matches the input `recordingId` if it was
     * specified.
     */
    recordingId: RecordingId;
}
export interface setRecordingMetadataParameters {
    recordingData: RecordingData;
    metadata?: any;
}
export interface setRecordingMetadataResult {
}
export interface addRecordingDataParameters {
    /**
     * ID of the recording data is being added to. This recording must have
     * been produced by a createRecording command previously sent on this
     * connection.
     */
    recordingId: RecordingId;
    /**
     * Byte offset into the recording's blob of the data being sent.
     */
    offset: number;
    /**
     * Byte length of the data being sent.
     */
    length: number;
}
export interface addRecordingDataResult {
}
export interface finishRecordingParameters {
    /**
     * ID of the recording being finished.
     */
    recordingId: RecordingId;
}
export interface finishRecordingResult {
}
export interface beginRecordingResourceUploadParameters {
    /**
     * ID of the recording.
     */
    recordingId: RecordingId;
}
export interface beginRecordingResourceUploadResult {
    /**
     * An identifier for the lock, in order to unlock.
     */
    key: string;
}
export interface endRecordingResourceUploadParameters {
    /**
     * ID of the recording.
     */
    key: string;
}
export interface endRecordingResourceUploadResult {
}
export interface echoParameters {
    str: string;
    count: number;
}
export interface echoResult {
    str: string;
}
export interface reportCrashParameters {
    data: any;
}
export interface reportCrashResult {
}
