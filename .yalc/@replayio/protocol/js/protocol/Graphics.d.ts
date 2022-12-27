import { TimeStampedPoint, ExecutionPoint } from "./Recording";
/**
 * Graphics encoding format.
 */
export declare type MimeType = "image/jpeg" | "image/png";
/**
 * Compact hash code for a screen shot.
 */
export declare type ScreenShotHash = string;
/**
 * Compact description of the graphics rendered at some point.
 */
export interface ScreenShotDescription {
    /**
     * Encoding used for the screen shot.
     */
    mimeType: MimeType;
    /**
     * Hash code for the screen shot's graphics data.
     */
    hash: ScreenShotHash;
}
/**
 * Complete contents of the graphics rendered at some point.
 */
export interface ScreenShot extends ScreenShotDescription {
    /**
     * Raw graphics data encoded in base64.
     */
    data: string;
    /**
     * The size of a CSS pixel relative to a pixel in this screenshot
     */
    scale: number;
}
/**
 * Information about a point where a paint occurred.
 */
export interface PaintPoint extends TimeStampedPoint {
    /**
     * Available screen shots for the graphics rendered at this point.
     */
    screenShots: ScreenShotDescription[];
}
export interface findPaintsParameters {
}
export interface findPaintsResult {
}
export interface getPaintContentsParameters {
    /**
     * Execution point to get the graphics for. This must have been listed in
     * a <code>paintPoints</code> event.
     */
    point: ExecutionPoint;
    /**
     * Encoding format for the returned screen.
     */
    mimeType: MimeType;
    /**
     * If specified, the returned screen will be scaled to the specified height.
     */
    resizeHeight?: number;
}
export interface getPaintContentsResult {
    /**
     * Screen shot of the rendered graphics.
     */
    screen: ScreenShot;
}
export interface getDevicePixelRatioParameters {
}
export interface getDevicePixelRatioResult {
    ratio: number;
}
/**
 * Describes some points in the recording at which paints occurred. No paint
 * will occur for the recording's beginning execution point.
 */
export interface paintPoints {
    paints: PaintPoint[];
}
