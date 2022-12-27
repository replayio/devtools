/**
 * An opaque salt value that can be used to create a Proof for a file.
 *
 * This string should be prepended to the file's content when calculating
 * the file's salted hash for the Proof.
 */
export declare type Token = string;
/**
 * A string representing hashed resource file content.
 *
 * All hashes should be computed with SHA256 and prefixed with "sha256:"
 * All hashes should be computed using the UTF8 encoding of their content.
 * All hashes should be encoded as hex.
 */
export declare type FileHash = string;
/**
 * An object representing knowledge of a file's full content.
 */
export interface Proof {
    token: Token;
    saltedHash: FileHash;
}
export interface tokenParameters {
    /**
     * The file's unsalted hash.
     */
    hash: FileHash;
}
export interface tokenResult {
    /**
     * The token to use to create a proof for this file.
     */
    token: Token;
    /**
     * The unixtime when the token will be invalidated, in seconds.
     */
    expiration: number;
}
export interface existsParameters {
    resource: Proof;
}
export interface existsResult {
    exists: boolean;
}
export interface createParameters {
    /**
     * The content you wish to upload.
     */
    content: string;
}
export interface createResult {
    /**
     * Proof that can be passed back to the server to reference this asset.
     */
    resource: Proof;
}
