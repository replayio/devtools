import { TextDecoder } from "util";

// @ts-ignore
global.TextDecoder = TextDecoder;

import {
  BodyPartsToUInt8Array,
  Displayable,
  DisplayableBody,
  RawToImageMaybe,
  RawToUTF8,
  StringToObjectMaybe,
  URLEncodedToPlaintext,
} from "./content";

export interface BodyData {
  offset: number;
  length: number;
  value: string;
}

// A 1px by 1px PNG file base64 encoded as one continuous string
const asBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAABYWlDQ1BrQ0dDb2xvclNwYWNlRGlzcGxheVAzAAAokWNgYFJJLCjIYWFgYMjNKykKcndSiIiMUmB/yMAOhLwMYgwKicnFBY4BAT5AJQwwGhV8u8bACKIv64LMOiU1tUm1XsDXYqbw1YuvRJsw1aMArpTU4mQg/QeIU5MLikoYGBhTgGzl8pICELsDyBYpAjoKyJ4DYqdD2BtA7CQI+whYTUiQM5B9A8hWSM5IBJrB+API1klCEk9HYkPtBQFul8zigpzESoUAYwKuJQOUpFaUgGjn/ILKosz0jBIFR2AopSp45iXr6SgYGRiaMzCAwhyi+nMgOCwZxc4gxJrvMzDY7v////9uhJjXfgaGjUCdXDsRYhoWDAyC3AwMJ3YWJBYlgoWYgZgpLY2B4dNyBgbeSAYG4QtAPdHFacZGYHlGHicGBtZ7//9/VmNgYJ/MwPB3wv//vxf9//93MVDzHQaGA3kAFSFl7jXH0fsAAAAJcEhZcwAACxMAAAsTAQCanBgAABEhaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA1LjQuMCI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgICAgICAgICB4bWxuczpleGlmRVg9Imh0dHA6Ly9jaXBhLmpwL2V4aWYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIj4KICAgICAgICAgPGV4aWY6Rmxhc2hQaXhWZXJzaW9uPjAxMDA8L2V4aWY6Rmxhc2hQaXhWZXJzaW9uPgogICAgICAgICA8ZXhpZjpTdWJqZWN0QXJlYT4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICAgICAgICAgICAgIDxyZGY6bGk+MjAxNTwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpPjE1MTE8L3JkZjpsaT4KICAgICAgICAgICAgICAgPHJkZjpsaT4yMjE3PC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGk+MTMzMDwvcmRmOmxpPgogICAgICAgICAgICA8L3JkZjpTZXE+CiAgICAgICAgIDwvZXhpZjpTdWJqZWN0QXJlYT4KICAgICAgICAgPGV4aWY6U2h1dHRlclNwZWVkVmFsdWU+OTgxOS84MTI8L2V4aWY6U2h1dHRlclNwZWVkVmFsdWU+CiAgICAgICAgIDxleGlmOkdQU0FsdGl0dWRlUmVmPjA8L2V4aWY6R1BTQWx0aXR1ZGVSZWY+CiAgICAgICAgIDxleGlmOlBpeGVsWERpbWVuc2lvbj40MDMyPC9leGlmOlBpeGVsWERpbWVuc2lvbj4KICAgICAgICAgPGV4aWY6U2Vuc2luZ01ldGhvZD4yPC9leGlmOlNlbnNpbmdNZXRob2Q+CiAgICAgICAgIDxleGlmOkZvY2FsTGVuZ3RoPjM5OS8xMDA8L2V4aWY6Rm9jYWxMZW5ndGg+CiAgICAgICAgIDxleGlmOkdQU0FsdGl0dWRlPjU2ODUvMzQ5PC9leGlmOkdQU0FsdGl0dWRlPgogICAgICAgICA8ZXhpZjpGb2NhbExlbkluMzVtbUZpbG0+Mjg8L2V4aWY6Rm9jYWxMZW5JbjM1bW1GaWxtPgogICAgICAgICA8ZXhpZjpXaGl0ZUJhbGFuY2U+MDwvZXhpZjpXaGl0ZUJhbGFuY2U+CiAgICAgICAgIDxleGlmOkdQU1NwZWVkUmVmPks8L2V4aWY6R1BTU3BlZWRSZWY+CiAgICAgICAgIDxleGlmOkV4cG9zdXJlUHJvZ3JhbT4yPC9leGlmOkV4cG9zdXJlUHJvZ3JhbT4KICAgICAgICAgPGV4aWY6R1BTTGF0aXR1ZGU+NDAsNDYuNzQxNU48L2V4aWY6R1BTTGF0aXR1ZGU+CiAgICAgICAgIDxleGlmOkV4aWZWZXJzaW9uPjAyMjE8L2V4aWY6RXhpZlZlcnNpb24+CiAgICAgICAgIDxleGlmOkdQU0RpcmVjdGlvbj4xNDg0NTAvNTcxPC9leGlmOkdQU0RpcmVjdGlvbj4KICAgICAgICAgPGV4aWY6RXhwb3N1cmVUaW1lPjEvNDM2NzwvZXhpZjpFeHBvc3VyZVRpbWU+CiAgICAgICAgIDxleGlmOlN1YnNlY1RpbWVEaWdpdGl6ZWQ+MTgzPC9leGlmOlN1YnNlY1RpbWVEaWdpdGl6ZWQ+CiAgICAgICAgIDxleGlmOkdQU1RpbWVTdGFtcD4yMDE4LTAzLTE1VDIyOjE4OjE2KzAwMDA8L2V4aWY6R1BTVGltZVN0YW1wPgogICAgICAgICA8ZXhpZjpDb21wb25lbnRzQ29uZmlndXJhdGlvbj4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICAgICAgICAgICAgIDxyZGY6bGk+MTwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpPjI8L3JkZjpsaT4KICAgICAgICAgICAgICAgPHJkZjpsaT4zPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGk+MDwvcmRmOmxpPgogICAgICAgICAgICA8L3JkZjpTZXE+CiAgICAgICAgIDwvZXhpZjpDb21wb25lbnRzQ29uZmlndXJhdGlvbj4KICAgICAgICAgPGV4aWY6QnJpZ2h0bmVzc1ZhbHVlPjY4MDEvNTk4PC9leGlmOkJyaWdodG5lc3NWYWx1ZT4KICAgICAgICAgPGV4aWY6R1BTRGVzdEJlYXJpbmc+MTQ4NDUwLzU3MTwvZXhpZjpHUFNEZXN0QmVhcmluZz4KICAgICAgICAgPGV4aWY6U3Vic2VjVGltZU9yaWdpbmFsPjE4MzwvZXhpZjpTdWJzZWNUaW1lT3JpZ2luYWw+CiAgICAgICAgIDxleGlmOkV4cG9zdXJlTW9kZT4wPC9leGlmOkV4cG9zdXJlTW9kZT4KICAgICAgICAgPGV4aWY6Rmxhc2ggcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICA8ZXhpZjpGdW5jdGlvbj5GYWxzZTwvZXhpZjpGdW5jdGlvbj4KICAgICAgICAgICAgPGV4aWY6RmlyZWQ+RmFsc2U8L2V4aWY6RmlyZWQ+CiAgICAgICAgICAgIDxleGlmOlJldHVybj4wPC9leGlmOlJldHVybj4KICAgICAgICAgICAgPGV4aWY6TW9kZT4yPC9leGlmOk1vZGU+CiAgICAgICAgICAgIDxleGlmOlJlZEV5ZU1vZGU+RmFsc2U8L2V4aWY6UmVkRXllTW9kZT4KICAgICAgICAgPC9leGlmOkZsYXNoPgogICAgICAgICA8ZXhpZjpHUFNIUG9zaXRpb25pbmdFcnJvcj4xMC8xPC9leGlmOkdQU0hQb3NpdGlvbmluZ0Vycm9yPgogICAgICAgICA8ZXhpZjpHUFNTcGVlZD4xMjEvMTAwPC9leGlmOkdQU1NwZWVkPgogICAgICAgICA8ZXhpZjpGTnVtYmVyPjkvNTwvZXhpZjpGTnVtYmVyPgogICAgICAgICA8ZXhpZjpFeHBvc3VyZUJpYXNWYWx1ZT4wLzE8L2V4aWY6RXhwb3N1cmVCaWFzVmFsdWU+CiAgICAgICAgIDxleGlmOkdQU0RpcmVjdGlvblJlZj5UPC9leGlmOkdQU0RpcmVjdGlvblJlZj4KICAgICAgICAgPGV4aWY6QXBlcnR1cmVWYWx1ZT4yMTU5LzEyNzM8L2V4aWY6QXBlcnR1cmVWYWx1ZT4KICAgICAgICAgPGV4aWY6R1BTTG9uZ2l0dWRlPjczLDU5LjM3NzVXPC9leGlmOkdQU0xvbmdpdHVkZT4KICAgICAgICAgPGV4aWY6UGl4ZWxZRGltZW5zaW9uPjMwMjQ8L2V4aWY6UGl4ZWxZRGltZW5zaW9uPgogICAgICAgICA8ZXhpZjpHUFNEZXN0QmVhcmluZ1JlZj5UPC9leGlmOkdQU0Rlc3RCZWFyaW5nUmVmPgogICAgICAgICA8ZXhpZjpNZXRlcmluZ01vZGU+NTwvZXhpZjpNZXRlcmluZ01vZGU+CiAgICAgICAgIDxleGlmOlNjZW5lVHlwZT4xPC9leGlmOlNjZW5lVHlwZT4KICAgICAgICAgPGV4aWY6SVNPU3BlZWRSYXRpbmdzPgogICAgICAgICAgICA8cmRmOlNlcT4KICAgICAgICAgICAgICAgPHJkZjpsaT4yNTwvcmRmOmxpPgogICAgICAgICAgICA8L3JkZjpTZXE+CiAgICAgICAgIDwvZXhpZjpJU09TcGVlZFJhdGluZ3M+CiAgICAgICAgIDxleGlmOlNjZW5lQ2FwdHVyZVR5cGU+MDwvZXhpZjpTY2VuZUNhcHR1cmVUeXBlPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpUaWxlV2lkdGg+NTEyPC90aWZmOlRpbGVXaWR0aD4KICAgICAgICAgPHRpZmY6TWFrZT5BcHBsZTwvdGlmZjpNYWtlPgogICAgICAgICA8dGlmZjpSZXNvbHV0aW9uVW5pdD4yPC90aWZmOlJlc29sdXRpb25Vbml0PgogICAgICAgICA8dGlmZjpNb2RlbD5pUGhvbmUgOCBQbHVzPC90aWZmOk1vZGVsPgogICAgICAgICA8dGlmZjpUaWxlTGVuZ3RoPjUxMjwvdGlmZjpUaWxlTGVuZ3RoPgogICAgICAgICA8eG1wOkNyZWF0b3JUb29sPjExLjIuNjwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxOC0wMy0xNVQxODoxODoxNy4xODM8L3htcDpDcmVhdGVEYXRlPgogICAgICAgICA8eG1wOk1vZGlmeURhdGU+MjAxOC0wMy0xNVQxODoxODoxNzwveG1wOk1vZGlmeURhdGU+CiAgICAgICAgIDxleGlmRVg6UGhvdG9ncmFwaGljU2Vuc2l0aXZpdHk+MjU8L2V4aWZFWDpQaG90b2dyYXBoaWNTZW5zaXRpdml0eT4KICAgICAgICAgPGV4aWZFWDpMZW5zTW9kZWw+aVBob25lIDggUGx1cyBiYWNrIGR1YWwgY2FtZXJhIDMuOTltbSBmLzEuODwvZXhpZkVYOkxlbnNNb2RlbD4KICAgICAgICAgPGV4aWZFWDpMZW5zU3BlY2lmaWNhdGlvbj4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICAgICAgICAgICAgIDxyZGY6bGk+Mzk5LzEwMDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpPjMzLzU8L3JkZjpsaT4KICAgICAgICAgICAgICAgPHJkZjpsaT45LzU8L3JkZjpsaT4KICAgICAgICAgICAgICAgPHJkZjpsaT4xNC81PC9yZGY6bGk+CiAgICAgICAgICAgIDwvcmRmOlNlcT4KICAgICAgICAgPC9leGlmRVg6TGVuc1NwZWNpZmljYXRpb24+CiAgICAgICAgIDxleGlmRVg6TGVuc01ha2U+QXBwbGU8L2V4aWZFWDpMZW5zTWFrZT4KICAgICAgICAgPHBob3Rvc2hvcDpEYXRlQ3JlYXRlZD4yMDE4LTAzLTE1VDE4OjE4OjE3LjE4MzwvcGhvdG9zaG9wOkRhdGVDcmVhdGVkPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KwJgligAAAA1JREFUCB1jYGBgOA8AANQA0HiTsgsAAAAASUVORK5CYII=";
// The same thing, turned into a UInt8Array
const asUInt8Array = Uint8Array.from(
  atob(asBase64)
    .split("")
    .map(c => c.charCodeAt(0))
);
// When we get response bodies from the backend they can be split up across
// multiple pieces, and each one invidually base64 encoded. This makes for
// some tricky edge-cases when trying to interpret content, which is why we
// have split up this 1px by 1px PNG into three slices.
const BODY_PARTS = [
  "\x89PNG\r\n\x1A\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\b\x06\x00\x00\x00\x1F\x15Ä\x89\x00\x00\x01aiCCPkCGColorSpaceDisplayP3\x00\x00(\x91c``RI,(Èaa``ÈÍ+)\nrwR\x88\x88\x8CR`\x7FÈÀ\x0E\x84¼\fb\f\n\x89ÉÅ\x05\x8E\x01\x01>@%\f0\x1A\x15|»ÆÀ\b¢/ë\x82Ì:%5µIµ^À×b¦ðÕ\x8B¯D\x9B0Õ£\x00®\x94Ôâd ý\x07\x88S\x93\v\x8AJ\x18\x18\x18S\x80låò\x92\x02\x10»\x03È\x16)\x02:\nÈ\x9E\x03b§CØ\x1B@ì$\bû\bXMH\x903\x90}\x03ÈVHÎH\x04\x9AÁø\x03ÈÖIB\x12OGbCí\x05\x01n\x97Ìâ\x82\x9CÄJ\x85\x00c\x02®%\x03\x94¤V\x94\x80hçü\x82Ê¢Ìô\x8C\x12\x05G`(¥*xæ%ëé(\x18\x19\x18\x9A30\x80Â\x1C¢ús 8,\x19ÅÎ Ä\x9Aï30Øîÿÿÿÿn\x84\x98×~\x06\x86\x8D@\x9D\\;\x11b\x1A\x16\f\f\x82Ü\f\f'v\x16$\x16%\x82\x85\x98\x81\x98)-\x8D\x81áÓr\x06\x06ÞH\x06\x06á\v@=ÑÅiÆF`yF\x1E'\x06\x06Ö{ÿÿ\x7FVc``\x9FÌÀðwÂÿÿ¿\x17ýÿÿw1Pó\x1D\x06\x86\x03y\x00\x15!eî5ÇÑû\x00\x00\x00\tpHYs\x00\x00\v\x13\x00\x00\v\x13\x01\x00\x9A\x9C\x18\x00\x00\x11!iTXtXML:com.adobe.xmp\x00\x00\x00\x00\x00",
  '<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="XMP Core 5.4.0">\n   <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n      <rdf:Description rdf:about=""\n            xmlns:exif="http://ns.adobe.com/exif/1.0/"\n            xmlns:tiff="http://ns.adobe.com/tiff/1.0/"\n            xmlns:xmp="http://ns.adobe.com/xap/1.0/"\n            xmlns:exifEX="http://cipa.jp/exif/1.0/"\n            xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/">\n         <exif:FlashPixVersion>0100</exif:FlashPixVersion>\n         <exif:SubjectArea>\n            <rdf:Seq>\n               <rdf:li>2015</rdf:li>\n               <rdf:li>1511</rdf:li>\n               <rdf:li>2217</rdf:li>\n               <rdf:li>1330</rdf:li>\n            </rdf:Seq>\n         </exif:SubjectArea>\n         <exif:ShutterSpeedValue>9819/812</exif:ShutterSpeedValue>\n         <exif:GPSAltitudeRef>0</exif:GPSAltitudeRef>\n         <exif:PixelXDimension>4032</exif:PixelXDimension>\n         <exif:SensingMethod>2</exif:SensingMethod>\n         <exif:FocalLength>399/100</exif:FocalLength>\n         <exif:GPSAltitude>5685/349</exif:GPSAltitude>\n         <exif:FocalLenIn35mmFilm>28</exif:FocalLenIn35mmFilm>\n         <exif:WhiteBalance>0</exif:WhiteBalance>\n         <exif:GPSSpeedRef>K</exif:GPSSpeedRef>\n         <exif:ExposureProgram>2</exif:ExposureProgram>\n         <exif:GPSLatitude>40,46.7415N</exif:GPSLatitude>\n         <exif:ExifVersion>0221</exif:ExifVersion>\n         <exif:GPSDirection>148450/571</exif:GPSDirection>\n         <exif:ExposureTime>1/4367</exif:ExposureTime>\n         <exif:SubsecTimeDigitized>183</exif:SubsecTimeDigitized>\n         <exif:GPSTimeStamp>2018-03-15T22:18:16+0000</exif:GPSTimeStamp>\n         <exif:ComponentsConfiguration>\n            <rdf:Seq>\n               <rdf:li>1</rdf:li>\n               <rdf:li>2</rdf:li>\n               <rdf:li>3</rdf:li>\n               <rdf:li>0</rdf:li>\n            </rdf:Seq>\n         </exif:ComponentsConfiguration>\n         <exif:BrightnessValue>6801/598</exif:BrightnessValue>\n         <exif:GPSDestBearing>148450/571</exif:GPSDestBearing>\n         <exif:SubsecTimeOriginal>183</exif:SubsecTimeOriginal>\n         <exif:ExposureMode>0</exif:ExposureMode>\n         <exif:Flash rdf:parseType="Resource">\n            <exif:Function>False</exif:Function>\n            <exif:Fired>False</exif:Fired>\n            <exif:Return>0</exif:Return>\n            <exif:Mode>2</exif:Mode>\n            <exif:RedEyeMode>False</exif:RedEyeMode>\n         </exif:Flash>\n         <exif:GPSHPositioningError>10/1</exif:GPSHPositioningError>\n         <exif:GPSSpeed>121/100</exif:GPSSpeed>\n         <exif:FNumber>9/5</exif:FNumber>\n         <exif:ExposureBiasValue>0/1</exif:ExposureBiasValue>\n         <exif:GPSDirectionRef>T</exif:GPSDirectionRef>\n         <exif:ApertureValue>2159/1273</exif:ApertureValue>\n         <exif:GPSLongitude>73,59.3775W</exif:GPSLongitude>\n         <exif:PixelYDimension>3024</exif:PixelYDimension>\n         <exif:GPSDestBearingRef>T</exif:GPSDestBearingRef>\n         <exif:MeteringMode>5</exif:MeteringMode>\n         <exif:SceneType>1</exif:SceneType>\n         <exif:ISOSpeedRatings>\n            <rdf:Seq>\n               <rdf:li>25</rdf:li>\n            </rdf:Seq>\n         </exif:ISOSpeedRatings>\n         <exif:SceneCaptureType>0</exif:SceneCaptureType>\n         <tiff:Orientation>1</tiff:Orientation>\n         <tiff:TileWidth>512</tiff:TileWidth>\n         <tiff:Make>Apple</tiff:Make>\n         <tiff:ResolutionUnit>2</tiff:ResolutionUnit>\n         <tiff:Model>iPhone 8 Plus</tiff:Model>\n         <tiff:TileLength>512</tiff:TileLength>\n         <xmp:CreatorTool>11.2.6</xmp:CreatorTool>\n         <xmp:CreateDate>2018-03-15T18:18:17.183</xmp:CreateDate>\n         <xmp:ModifyDate>2018-03-15T18:18:17</xmp:ModifyDate>\n         <exifEX:PhotographicSensitivity>25</exifEX:PhotographicSensitivity>\n         <exifEX:LensModel>iPhone 8 Plus back dual camera 3.99mm f/1.8</exifEX:LensModel>\n         <exifEX:LensSpecification>\n            <rdf:Seq>\n               <rdf:li>399/100</rdf:li>\n               <rdf:li>33/5</rdf:li>\n               <rdf:li>9/5</rdf:li>\n               <rdf:li>14/5</rdf:li>\n            </rdf:Seq>\n         </exifEX:LensSpecification>\n         <exifEX:LensMake>Apple</exifEX:LensMake>\n         <photoshop:DateCreated>2018-03-15T18:18:17.183</photoshop:DateCreated>\n      </rdf:Description>\n   </rdf:RDF>\n',
  "</x:xmpmeta>\nÀ\x98%\x8A\x00\x00\x00\rIDAT\b\x1Dc```8\x0F\x00\x00Ô\x00Ðx\x93²\v\x00\x00\x00\x00IEND®B`\x82",
];

const datasFromParts = (parts: string[]) => {
  let offset = 0;
  return parts.map(part => {
    const bodyData = {
      length: part.length,
      offset,
      value: btoa(part),
    };
    offset += part.length;
    return bodyData;
  });
};

// This is the same thing, just turned into BodyData like we would get from the
// backend. See: https://static.replay.io/protocol/tot/Network/#type-BodyData
const BODY_DATAS: BodyData[] = datasFromParts(BODY_PARTS);

const PNG = "image/png";
const PLAINTEXT = "text/plain";

const PLAIN_TEXT_DISPLAYABLE: DisplayableBody = {
  as: Displayable.Text,
  content: "some plaintext",
  contentType: PLAINTEXT,
};

describe("BodyPartsToUInt8Array", () => {
  it("returns the correct displayable", () => {
    const raw = BodyPartsToUInt8Array(BODY_DATAS, PNG);

    expect(raw.as).toEqual(Displayable.Raw);
  });

  it("returns the correct content type", () => {
    const raw = BodyPartsToUInt8Array(BODY_DATAS, PNG);

    expect(raw.contentType).toEqual(PNG);
  });

  it("returns the correct content", () => {
    const raw = BodyPartsToUInt8Array(BODY_DATAS, PNG);

    expect(String(raw.content)).toEqual(String(asUInt8Array));
  });
});

describe("RawToImageMaybe", () => {
  it("returns a non-image displayable without alteration", () => {
    expect(RawToImageMaybe(PLAIN_TEXT_DISPLAYABLE)).toEqual(PLAIN_TEXT_DISPLAYABLE);
  });

  it("returns an image displayable correctly", () => {
    expect(RawToImageMaybe(BodyPartsToUInt8Array(BODY_DATAS, PNG))).toEqual({
      as: Displayable.Image,
      content: asBase64,
      contentType: PNG,
    });
  });
});

describe("RawToUTF8", () => {
  it("returns a non-raw displayable without alteration", () => {
    expect(RawToUTF8(PLAIN_TEXT_DISPLAYABLE)).toEqual(PLAIN_TEXT_DISPLAYABLE);
  });

  it("returns an Raw displayable correctly", () => {
    expect(RawToUTF8(BodyPartsToUInt8Array(datasFromParts(["foo", "bar"]), PLAINTEXT))).toEqual({
      as: Displayable.Text,
      content: "foobar",
      contentType: PLAINTEXT,
    });
  });
});

describe("StringToObjectMaybe", () => {
  it("returns a non-text displayable without alteration", () => {
    expect(StringToObjectMaybe(BodyPartsToUInt8Array(BODY_DATAS, PNG))).toEqual(
      BodyPartsToUInt8Array(BODY_DATAS, PNG)
    );
  });

  it("returns an JSON displayable correctly", () => {
    expect(
      StringToObjectMaybe({
        as: Displayable.Text,
        content: '{"foo": "bar"}',
        contentType: "text/plain",
      })
    ).toEqual({
      as: Displayable.JSON,
      content: { foo: "bar" },
      contentType: "text/plain",
    });
  });

  it("returns an non-JSON text displayable without alteration", () => {
    expect(
      StringToObjectMaybe({
        as: Displayable.Text,
        content: "invalid json",
        contentType: "text/plain",
      })
    ).toEqual({
      as: Displayable.Text,
      content: "invalid json",
      contentType: "text/plain",
    });
  });
});

describe("URLEncodedToPlaintext", () => {
  it("returns a non-text displayable without alteration", () => {
    expect(URLEncodedToPlaintext(BodyPartsToUInt8Array(BODY_DATAS, PNG))).toEqual(
      BodyPartsToUInt8Array(BODY_DATAS, PNG)
    );
  });

  it("returns a text displayable without alteration if it has a different content-type", () => {
    expect(
      URLEncodedToPlaintext({
        as: Displayable.Text,
        content: encodeURI("foo bar"),
        contentType: "text/plain",
      })
    ).toEqual({
      as: Displayable.Text,
      content: encodeURI("foo bar"),
      contentType: "text/plain",
    });
  });

  it("returns a URL encoded displayable correctly if it has the right content-type", () => {
    expect(
      URLEncodedToPlaintext({
        as: Displayable.Text,
        content: encodeURI("foo bar"),
        contentType: "application/x-www-form-urlencoded",
      })
    ).toEqual({
      as: Displayable.Text,
      content: "foo bar",
      contentType: "application/x-www-form-urlencoded",
    });
  });
});
