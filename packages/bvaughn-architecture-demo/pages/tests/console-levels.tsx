import ConsoleRoot from "@bvaughn/components/console";
import Initializer from "@bvaughn/components/Initializer";
import { FocusContextRoot } from "@bvaughn/src/contexts/FocusContext";
import { PauseContextRoot } from "@bvaughn/src/contexts/PauseContext";
import { PointsContextRoot } from "@bvaughn/src/contexts/PointsContext";
import createReplayClientPlayer from "shared/client/createReplayClientPlayer";
import { decode } from "shared/client/encoder";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import styles from "./styles.module.css";

// This data was recorded using createReplayClientRecorder().
// To re-record it, append a "record" parameter to the player URL.

const ACCESS_TOKEN = null;
const RECORDING_ID = "<fake-recording-id>";
const replayClientPlayer = createReplayClientPlayer(
  decode(`[
{
"args": [
"<fake-recording-id>",
null
],
"isAsync": true,
"method": "initialize",
"result": "3c88e13c-7f29-48d9-ae6c-786c839348e9/c60f6daf-266e-4681-a94e-d393a8a17ada"
},
{
"args": [
"3c88e13c-7f29-48d9-ae6c-786c839348e9/c60f6daf-266e-4681-a94e-d393a8a17ada"
],
"isAsync": true,
"method": "getSessionEndpoint",
"result": {
"point": "24987928631699160027737220578279424",
"time": 17294
}
},
{
"args": [],
"isAsync": true,
"method": "findSources",
"result": [
{
  "sourceId": "1",
  "contentHash": "03edba20808e84cd6d15edc352656a98f48e429cfe1b0a85dd47e8bfe38d1cc4",
  "kind": "scriptSource",
  "url": "https://unpkg.com/react-is@18.2.0/umd/react-is.development.js"
},
{
  "sourceId": "h1",
  "contentHash": "0141046c3b8ab06f73ee6378b99d88c75390c7ef952fe9344846ee9fffadf3c0",
  "generatedSourceIds": [
    "2"
  ],
  "kind": "html",
  "url": "file:///Users/bvaughn/Desktop/test-console-levels.html"
},
{
  "sourceId": "2",
  "contentHash": "b40e0ae4b6593305c58e2272cdba87bf5cbb4917c25cdc7c193a13fa263fe5d5",
  "kind": "inlineScript",
  "url": "file:///Users/bvaughn/Desktop/test-console-levels.html"
}
]
},
{
"args": [
"1"
],
"isAsync": true,
"method": "getSourceHitCounts",
"result": {
"dataType": "Map",
"value": [
  [
    10,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 10,
            "column": 1
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    14,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 14,
            "column": 1
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 14,
            "column": 0
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    221,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 221,
            "column": 0
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    11,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 11,
            "column": 2
          }
        },
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 11,
            "column": 65
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    12,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 12,
            "column": 47
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    13,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 13,
            "column": 28
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    20,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 20,
            "column": 27
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 20,
            "column": 34
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    21,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 21,
            "column": 26
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 21,
            "column": 33
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    22,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 22,
            "column": 28
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 22,
            "column": 35
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    23,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 23,
            "column": 31
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 23,
            "column": 38
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    24,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 24,
            "column": 28
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 24,
            "column": 35
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    25,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 25,
            "column": 28
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 25,
            "column": 35
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    26,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 26,
            "column": 27
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 26,
            "column": 34
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    27,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 27,
            "column": 34
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 27,
            "column": 41
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    28,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 28,
            "column": 31
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 28,
            "column": 38
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    29,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 29,
            "column": 28
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 29,
            "column": 35
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    30,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 30,
            "column": 33
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 30,
            "column": 40
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    31,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 31,
            "column": 24
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 31,
            "column": 31
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    32,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 32,
            "column": 24
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 32,
            "column": 31
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    33,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 33,
            "column": 29
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 33,
            "column": 36
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    37,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 37,
            "column": 23
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    38,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 38,
            "column": 27
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    39,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 39,
            "column": 32
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    41,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 41,
            "column": 27
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    45,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 45,
            "column": 27
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    50,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 50,
            "column": 4
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 50,
            "column": 36
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    117,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 117,
            "column": 24
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    118,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 118,
            "column": 24
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    119,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 119,
            "column": 16
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    120,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 120,
            "column": 19
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    121,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 121,
            "column": 17
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    122,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 122,
            "column": 13
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    123,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 123,
            "column": 13
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    124,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 124,
            "column": 15
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    125,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 125,
            "column": 17
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    126,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 126,
            "column": 19
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    127,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 127,
            "column": 17
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    128,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 128,
            "column": 21
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    129,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 129,
            "column": 44
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    130,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 130,
            "column": 49
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    191,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 191,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    192,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 192,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    193,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 193,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    194,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 194,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    195,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 195,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    196,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 196,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    197,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 197,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    198,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 198,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    199,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 199,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    200,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 200,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    201,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 201,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    202,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 202,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    203,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 203,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    204,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 204,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    205,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 205,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    206,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 206,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    207,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 207,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    208,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 208,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    209,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 209,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    210,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 210,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    211,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 211,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    212,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 212,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    213,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 213,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    214,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 214,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    215,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 215,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    216,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 216,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    217,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 217,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    218,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 218,
            "column": 2
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    220,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 220,
            "column": 0
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    54,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 54,
            "column": 8
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    55,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 55,
            "column": 6
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    59,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 59,
            "column": 8
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    60,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 60,
            "column": 6
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    63,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 63,
            "column": 8
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    64,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 64,
            "column": 10
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    69,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 69,
            "column": 8
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    73,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 73,
            "column": 4
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    74,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 74,
            "column": 2
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    77,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 77,
            "column": 8
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    78,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 78,
            "column": 21
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    80,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 80,
            "column": 14
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    82,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 82,
            "column": 21
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    84,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 84,
            "column": 18
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    90,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 90,
            "column": 14
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    93,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 93,
            "column": 33
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    95,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 95,
            "column": 22
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    102,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 102,
            "column": 18
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    105,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 105,
            "column": 18
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    111,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 111,
            "column": 10
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    115,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 115,
            "column": 4
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    116,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 116,
            "column": 2
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    134,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 134,
            "column": 10
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    135,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 135,
            "column": 8
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    137,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 137,
            "column": 8
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 137,
            "column": 16
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    141,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "1",
            "line": 141,
            "column": 4
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    142,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 142,
            "column": 2
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    145,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 145,
            "column": 10
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    146,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 146,
            "column": 8
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    148,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 148,
            "column": 8
          }
        },
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 148,
            "column": 16
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    152,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 152,
            "column": 4
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    153,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 153,
            "column": 2
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    155,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 155,
            "column": 4
          }
        },
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 155,
            "column": 11
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    156,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 156,
            "column": 2
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    158,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 158,
            "column": 4
          }
        },
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 158,
            "column": 11
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    159,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 159,
            "column": 2
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    161,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 161,
            "column": 11
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    162,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 162,
            "column": 2
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    164,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 164,
            "column": 4
          }
        },
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 164,
            "column": 11
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    165,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 165,
            "column": 2
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    167,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 167,
            "column": 4
          }
        },
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 167,
            "column": 11
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    168,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 168,
            "column": 2
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    170,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 170,
            "column": 4
          }
        },
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 170,
            "column": 11
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    171,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 171,
            "column": 2
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    173,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 173,
            "column": 4
          }
        },
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 173,
            "column": 11
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    174,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 174,
            "column": 2
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    176,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 176,
            "column": 4
          }
        },
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 176,
            "column": 11
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    177,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 177,
            "column": 2
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    179,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 179,
            "column": 4
          }
        },
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 179,
            "column": 11
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    180,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 180,
            "column": 2
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    182,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 182,
            "column": 4
          }
        },
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 182,
            "column": 11
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    183,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 183,
            "column": 2
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    185,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 185,
            "column": 4
          }
        },
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 185,
            "column": 11
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    186,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 186,
            "column": 2
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    188,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 188,
            "column": 4
          }
        },
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 188,
            "column": 11
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    189,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "1",
            "line": 189,
            "column": 2
          }
        }
      ],
      "hits": 0
    }
  ]
]
}
},
{
"args": [
"1"
],
"isAsync": true,
"method": "getSourceContents",
"result": {
"contents": "/**\\n * @license React\\n * react-is.development.js\\n *\\n * Copyright (c) Facebook, Inc. and its affiliates.\\n *\\n * This source code is licensed under the MIT license found in the\\n * LICENSE file in the root directory of this source tree.\\n */\\n(function (global, factory) {\\n  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :\\n  typeof define === 'function' && define.amd ? define(['exports'], factory) :\\n  (global = global || self, factory(global.ReactIs = {}));\\n}(this, (function (exports) { 'use strict';\\n\\n  // ATTENTION\\n  // When adding new symbols to this file,\\n  // Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'\\n  // The Symbol used to tag the ReactElement-like types.\\n  var REACT_ELEMENT_TYPE = Symbol.for('react.element');\\n  var REACT_PORTAL_TYPE = Symbol.for('react.portal');\\n  var REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');\\n  var REACT_STRICT_MODE_TYPE = Symbol.for('react.strict_mode');\\n  var REACT_PROFILER_TYPE = Symbol.for('react.profiler');\\n  var REACT_PROVIDER_TYPE = Symbol.for('react.provider');\\n  var REACT_CONTEXT_TYPE = Symbol.for('react.context');\\n  var REACT_SERVER_CONTEXT_TYPE = Symbol.for('react.server_context');\\n  var REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');\\n  var REACT_SUSPENSE_TYPE = Symbol.for('react.suspense');\\n  var REACT_SUSPENSE_LIST_TYPE = Symbol.for('react.suspense_list');\\n  var REACT_MEMO_TYPE = Symbol.for('react.memo');\\n  var REACT_LAZY_TYPE = Symbol.for('react.lazy');\\n  var REACT_OFFSCREEN_TYPE = Symbol.for('react.offscreen');\\n\\n  // -----------------------------------------------------------------------------\\n\\n  var enableScopeAPI = false; // Experimental Create Event Handle API.\\n  var enableCacheElement = false;\\n  var enableTransitionTracing = false; // No known bugs, but needs performance testing\\n\\n  var enableLegacyHidden = false; // Enables unstable_avoidThisFallback feature in Fiber\\n  // stuff. Intended to enable React core members to more easily debug scheduling\\n  // issues in DEV builds.\\n\\n  var enableDebugTracing = false; // Track which Fiber(s) schedule render work.\\n\\n  var REACT_MODULE_REFERENCE;\\n\\n  {\\n    REACT_MODULE_REFERENCE = Symbol.for('react.module.reference');\\n  }\\n\\n  function isValidElementType(type) {\\n    if (typeof type === 'string' || typeof type === 'function') {\\n      return true;\\n    } // Note: typeof might be other than 'symbol' or 'number' (e.g. if it's a polyfill).\\n\\n\\n    if (type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || enableDebugTracing  || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || enableLegacyHidden  || type === REACT_OFFSCREEN_TYPE || enableScopeAPI  || enableCacheElement  || enableTransitionTracing ) {\\n      return true;\\n    }\\n\\n    if (typeof type === 'object' && type !== null) {\\n      if (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || // This needs to include all possible module reference object\\n      // types supported by any Flight configuration anywhere since\\n      // we don't know which Flight build this will end up being used\\n      // with.\\n      type.$$typeof === REACT_MODULE_REFERENCE || type.getModuleId !== undefined) {\\n        return true;\\n      }\\n    }\\n\\n    return false;\\n  }\\n\\n  function typeOf(object) {\\n    if (typeof object === 'object' && object !== null) {\\n      var $$typeof = object.$$typeof;\\n\\n      switch ($$typeof) {\\n        case REACT_ELEMENT_TYPE:\\n          var type = object.type;\\n\\n          switch (type) {\\n            case REACT_FRAGMENT_TYPE:\\n            case REACT_PROFILER_TYPE:\\n            case REACT_STRICT_MODE_TYPE:\\n            case REACT_SUSPENSE_TYPE:\\n            case REACT_SUSPENSE_LIST_TYPE:\\n              return type;\\n\\n            default:\\n              var $$typeofType = type && type.$$typeof;\\n\\n              switch ($$typeofType) {\\n                case REACT_SERVER_CONTEXT_TYPE:\\n                case REACT_CONTEXT_TYPE:\\n                case REACT_FORWARD_REF_TYPE:\\n                case REACT_LAZY_TYPE:\\n                case REACT_MEMO_TYPE:\\n                case REACT_PROVIDER_TYPE:\\n                  return $$typeofType;\\n\\n                default:\\n                  return $$typeof;\\n              }\\n\\n          }\\n\\n        case REACT_PORTAL_TYPE:\\n          return $$typeof;\\n      }\\n    }\\n\\n    return undefined;\\n  }\\n  var ContextConsumer = REACT_CONTEXT_TYPE;\\n  var ContextProvider = REACT_PROVIDER_TYPE;\\n  var Element = REACT_ELEMENT_TYPE;\\n  var ForwardRef = REACT_FORWARD_REF_TYPE;\\n  var Fragment = REACT_FRAGMENT_TYPE;\\n  var Lazy = REACT_LAZY_TYPE;\\n  var Memo = REACT_MEMO_TYPE;\\n  var Portal = REACT_PORTAL_TYPE;\\n  var Profiler = REACT_PROFILER_TYPE;\\n  var StrictMode = REACT_STRICT_MODE_TYPE;\\n  var Suspense = REACT_SUSPENSE_TYPE;\\n  var SuspenseList = REACT_SUSPENSE_LIST_TYPE;\\n  var hasWarnedAboutDeprecatedIsAsyncMode = false;\\n  var hasWarnedAboutDeprecatedIsConcurrentMode = false; // AsyncMode should be deprecated\\n\\n  function isAsyncMode(object) {\\n    {\\n      if (!hasWarnedAboutDeprecatedIsAsyncMode) {\\n        hasWarnedAboutDeprecatedIsAsyncMode = true; // Using console['warn'] to evade Babel and ESLint\\n\\n        console['warn']('The ReactIs.isAsyncMode() alias has been deprecated, ' + 'and will be removed in React 18+.');\\n      }\\n    }\\n\\n    return false;\\n  }\\n  function isConcurrentMode(object) {\\n    {\\n      if (!hasWarnedAboutDeprecatedIsConcurrentMode) {\\n        hasWarnedAboutDeprecatedIsConcurrentMode = true; // Using console['warn'] to evade Babel and ESLint\\n\\n        console['warn']('The ReactIs.isConcurrentMode() alias has been deprecated, ' + 'and will be removed in React 18+.');\\n      }\\n    }\\n\\n    return false;\\n  }\\n  function isContextConsumer(object) {\\n    return typeOf(object) === REACT_CONTEXT_TYPE;\\n  }\\n  function isContextProvider(object) {\\n    return typeOf(object) === REACT_PROVIDER_TYPE;\\n  }\\n  function isElement(object) {\\n    return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;\\n  }\\n  function isForwardRef(object) {\\n    return typeOf(object) === REACT_FORWARD_REF_TYPE;\\n  }\\n  function isFragment(object) {\\n    return typeOf(object) === REACT_FRAGMENT_TYPE;\\n  }\\n  function isLazy(object) {\\n    return typeOf(object) === REACT_LAZY_TYPE;\\n  }\\n  function isMemo(object) {\\n    return typeOf(object) === REACT_MEMO_TYPE;\\n  }\\n  function isPortal(object) {\\n    return typeOf(object) === REACT_PORTAL_TYPE;\\n  }\\n  function isProfiler(object) {\\n    return typeOf(object) === REACT_PROFILER_TYPE;\\n  }\\n  function isStrictMode(object) {\\n    return typeOf(object) === REACT_STRICT_MODE_TYPE;\\n  }\\n  function isSuspense(object) {\\n    return typeOf(object) === REACT_SUSPENSE_TYPE;\\n  }\\n  function isSuspenseList(object) {\\n    return typeOf(object) === REACT_SUSPENSE_LIST_TYPE;\\n  }\\n\\n  exports.ContextConsumer = ContextConsumer;\\n  exports.ContextProvider = ContextProvider;\\n  exports.Element = Element;\\n  exports.ForwardRef = ForwardRef;\\n  exports.Fragment = Fragment;\\n  exports.Lazy = Lazy;\\n  exports.Memo = Memo;\\n  exports.Portal = Portal;\\n  exports.Profiler = Profiler;\\n  exports.StrictMode = StrictMode;\\n  exports.Suspense = Suspense;\\n  exports.SuspenseList = SuspenseList;\\n  exports.isAsyncMode = isAsyncMode;\\n  exports.isConcurrentMode = isConcurrentMode;\\n  exports.isContextConsumer = isContextConsumer;\\n  exports.isContextProvider = isContextProvider;\\n  exports.isElement = isElement;\\n  exports.isForwardRef = isForwardRef;\\n  exports.isFragment = isFragment;\\n  exports.isLazy = isLazy;\\n  exports.isMemo = isMemo;\\n  exports.isPortal = isPortal;\\n  exports.isProfiler = isProfiler;\\n  exports.isStrictMode = isStrictMode;\\n  exports.isSuspense = isSuspense;\\n  exports.isSuspenseList = isSuspenseList;\\n  exports.isValidElementType = isValidElementType;\\n  exports.typeOf = typeOf;\\n\\n})));\\n",
"contentType": "text/javascript"
}
},
{
"args": [
null
],
"isAsync": true,
"method": "findMessages",
"result": {
"messages": [
  {
    "source": "ConsoleAPI",
    "level": "warning",
    "text": "",
    "point": {
      "point": "324518553658463620271303439679509",
      "time": 127,
      "frame": [
        {
          "sourceId": "1",
          "line": 137,
          "column": 16,
          "functionId": "6",
          "offset": 206
        }
      ]
    },
    "pauseId": "c81880bc-5a87-4e0a-b543-228a32e1e56d",
    "argumentValues": [
      {
        "value": "The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 18+."
      }
    ],
    "stack": [
      "0",
      "1"
    ],
    "data": {
      "frames": [
        {
          "frameId": "1",
          "location": [
            {
              "column": 14,
              "line": 60,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 60,
              "column": 14
            }
          ],
          "scopeChain": [
            "1",
            "2"
          ],
          "this": {
            "object": "3"
          },
          "type": "global"
        },
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 22,
              "line": 132,
              "sourceId": "1"
            }
          ],
          "functionName": "isAsyncMode",
          "location": [
            {
              "sourceId": "1",
              "line": 137,
              "column": 16,
              "functionId": "6",
              "offset": 206
            }
          ],
          "scopeChain": [
            "4",
            "5",
            "1",
            "2"
          ],
          "this": {
            "object": "6"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Window",
          "objectId": "3"
        },
        {
          "className": "Object",
          "objectId": "6"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "error",
    "text": "",
    "point": {
      "point": "1298074214633781847030423527358510",
      "time": 444,
      "frame": [
        {
          "column": 16,
          "line": 16,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 16,
          "column": 16
        }
      ]
    },
    "pauseId": "ea379e59-44b9-4e2c-ab8e-0fbfc1a8e602",
    "argumentValues": [
      {
        "value": "This is an error for URL"
      },
      {
        "value": "file:///Users/bvaughn/Desktop/test-console-levels.html"
      }
    ],
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 25,
              "line": 15,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 15,
              "column": 25
            }
          ],
          "functionName": "printError",
          "location": [
            {
              "column": 16,
              "line": 16,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 16,
              "column": 16
            }
          ],
          "scopeChain": [
            "1",
            "2",
            "3"
          ],
          "this": {
            "object": "4"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Window",
          "objectId": "4"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "error",
    "text": "",
    "point": {
      "point": "2271629875609092003339011367108674",
      "time": 749,
      "frame": [
        {
          "column": 16,
          "line": 16,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 16,
          "column": 16
        }
      ]
    },
    "pauseId": "cb74a304-322f-450f-9566-0f5ca9ce2b2b",
    "argumentValues": [
      {
        "value": "This is an error for URL"
      },
      {
        "value": "file:///Users/bvaughn/Desktop/test-console-levels.html"
      }
    ],
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 25,
              "line": 15,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 15,
              "column": 25
            }
          ],
          "functionName": "printError",
          "location": [
            {
              "column": 16,
              "line": 16,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 16,
              "column": 16
            }
          ],
          "scopeChain": [
            "1",
            "2",
            "3"
          ],
          "this": {
            "object": "4"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Window",
          "objectId": "4"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "trace",
    "text": "",
    "point": {
      "point": "2271629875609093156260515973955651",
      "time": 750,
      "frame": [
        {
          "column": 18,
          "line": 21,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 21,
          "column": 18
        }
      ]
    },
    "pauseId": "0cfaac58-5a8a-432f-b10c-1c535f97909f",
    "argumentValues": [
      {
        "value": "All errors printed"
      }
    ],
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 25,
              "line": 15,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 15,
              "column": 25
            }
          ],
          "functionName": "printError",
          "location": [
            {
              "column": 18,
              "line": 21,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 21,
              "column": 18
            }
          ],
          "scopeChain": [
            "1",
            "2",
            "3"
          ],
          "this": {
            "object": "4"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Window",
          "objectId": "4"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "warning",
    "text": "",
    "point": {
      "point": "2596148429267529106415708849307720",
      "time": 824,
      "frame": [
        {
          "column": 16,
          "line": 36,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 36,
          "column": 16
        }
      ]
    },
    "pauseId": "04bcee07-a3d4-4ea7-8302-fff594e62fc6",
    "argumentValues": [
      {
        "value": "This is a warning at"
      },
      {
        "object": "1"
      }
    ],
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 27,
              "line": 35,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 35,
              "column": 27
            }
          ],
          "functionName": "printWarning",
          "location": [
            {
              "column": 16,
              "line": 36,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 36,
              "column": 16
            }
          ],
          "scopeChain": [
            "3",
            "4",
            "5"
          ],
          "this": {
            "object": "6"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Date",
          "objectId": "1",
          "preview": {
            "dateTime": 1657042899494,
            "prototypeId": "2"
          }
        },
        {
          "className": "Window",
          "objectId": "6"
        },
        {
          "className": "Date.prototype",
          "objectId": "2"
        }
      ]
    }
  },
  {
    "source": "PageError",
    "level": "error",
    "text": "Error: This is an exception",
    "point": {
      "point": "2920666982925974279942938579435604",
      "time": 1009,
      "frame": [
        {
          "column": 14,
          "line": 46,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 46,
          "column": 14
        }
      ]
    },
    "pauseId": "85e3c6eb-30dd-4767-be61-991446238b8a",
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 29,
              "line": 45,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 45,
              "column": 29
            }
          ],
          "functionName": "throwException",
          "location": [
            {
              "column": 14,
              "line": 46,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 46,
              "column": 14
            }
          ],
          "scopeChain": [
            "1",
            "2",
            "3"
          ],
          "this": {
            "object": "4"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Window",
          "objectId": "4"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "info",
    "text": "",
    "point": {
      "point": "3569704090242845027331819723292768",
      "time": 1254,
      "frame": [
        {
          "column": 16,
          "line": 26,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 26,
          "column": 16
        }
      ]
    },
    "pauseId": "bbdece1d-d9d5-4a89-bf3a-5e66f82e63c1",
    "argumentValues": [
      {
        "value": "This is a console log"
      }
    ],
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 23,
              "line": 25,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 25,
              "column": 23
            }
          ],
          "functionName": "printLog",
          "location": [
            {
              "column": 16,
              "line": 26,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 26,
              "column": 16
            }
          ],
          "scopeChain": [
            "1",
            "2",
            "3"
          ],
          "this": {
            "object": "4"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Window",
          "objectId": "4"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "warning",
    "text": "",
    "point": {
      "point": "3894222643901277518722498778103905",
      "time": 1373,
      "frame": [
        {
          "column": 16,
          "line": 36,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 36,
          "column": 16
        }
      ]
    },
    "pauseId": "99357360-a8cd-47dc-a914-5ec79f217be7",
    "argumentValues": [
      {
        "value": "This is a warning at"
      },
      {
        "object": "1"
      }
    ],
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 27,
              "line": 35,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 35,
              "column": 27
            }
          ],
          "functionName": "printWarning",
          "location": [
            {
              "column": 16,
              "line": 36,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 36,
              "column": 16
            }
          ],
          "scopeChain": [
            "3",
            "4",
            "5"
          ],
          "this": {
            "object": "6"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Date",
          "objectId": "1",
          "preview": {
            "dateTime": 1657042900041,
            "prototypeId": "2"
          }
        },
        {
          "className": "Window",
          "objectId": "6"
        },
        {
          "className": "Date.prototype",
          "objectId": "2"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "info",
    "text": "",
    "point": {
      "point": "4543259751218136736896333853491298",
      "time": 1875,
      "frame": [
        {
          "column": 16,
          "line": 26,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 26,
          "column": 16
        }
      ]
    },
    "pauseId": "b18e4e07-f917-4423-b674-1c0565b74cc3",
    "argumentValues": [
      {
        "value": "This is a console log"
      }
    ],
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 23,
              "line": 25,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 25,
              "column": 23
            }
          ],
          "functionName": "printLog",
          "location": [
            {
              "column": 16,
              "line": 26,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 26,
              "column": 16
            }
          ],
          "scopeChain": [
            "1",
            "2",
            "3"
          ],
          "this": {
            "object": "4"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Window",
          "objectId": "4"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "warning",
    "text": "",
    "point": {
      "point": "5516815412193422681853324949454947",
      "time": 2427,
      "frame": [
        {
          "column": 16,
          "line": 36,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 36,
          "column": 16
        }
      ]
    },
    "pauseId": "db945bf7-7817-4f3b-8167-928ef45e74e2",
    "argumentValues": [
      {
        "value": "This is a warning at"
      },
      {
        "object": "1"
      }
    ],
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 27,
              "line": 35,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 35,
              "column": 27
            }
          ],
          "functionName": "printWarning",
          "location": [
            {
              "column": 16,
              "line": 36,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 36,
              "column": 16
            }
          ],
          "scopeChain": [
            "3",
            "4",
            "5"
          ],
          "this": {
            "object": "6"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Date",
          "objectId": "1",
          "preview": {
            "dateTime": 1657042901099,
            "prototypeId": "2"
          }
        },
        {
          "className": "Window",
          "objectId": "6"
        },
        {
          "className": "Date.prototype",
          "objectId": "2"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "warning",
    "text": "",
    "point": {
      "point": "6165852519510281900027160024842340",
      "time": 2765,
      "frame": [
        {
          "column": 16,
          "line": 36,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 36,
          "column": 16
        }
      ]
    },
    "pauseId": "86fa3f1f-d133-4a7e-81c5-c28289a1fd90",
    "argumentValues": [
      {
        "value": "This is a warning at"
      },
      {
        "object": "1"
      }
    ],
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 27,
              "line": 35,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 35,
              "column": 27
            }
          ],
          "functionName": "printWarning",
          "location": [
            {
              "column": 16,
              "line": 36,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 36,
              "column": 16
            }
          ],
          "scopeChain": [
            "3",
            "4",
            "5"
          ],
          "this": {
            "object": "6"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Date",
          "objectId": "1",
          "preview": {
            "dateTime": 1657042901435,
            "prototypeId": "2"
          }
        },
        {
          "className": "Window",
          "objectId": "6"
        },
        {
          "className": "Date.prototype",
          "objectId": "2"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "info",
    "text": "",
    "point": {
      "point": "6490371073168714391417839079653477",
      "time": 2928,
      "frame": [
        {
          "column": 16,
          "line": 26,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 26,
          "column": 16
        }
      ]
    },
    "pauseId": "1ec54b6e-1e4a-4f0c-acd8-4a8fadc91ebe",
    "argumentValues": [
      {
        "value": "This is a console log"
      }
    ],
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 23,
              "line": 25,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 25,
              "column": 23
            }
          ],
          "functionName": "printLog",
          "location": [
            {
              "column": 16,
              "line": 26,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 26,
              "column": 16
            }
          ],
          "scopeChain": [
            "1",
            "2",
            "3"
          ],
          "this": {
            "object": "4"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Window",
          "objectId": "4"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "warning",
    "text": "",
    "point": {
      "point": "6814889626827146882808518134464614",
      "time": 3048,
      "frame": [
        {
          "column": 16,
          "line": 36,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 36,
          "column": 16
        }
      ]
    },
    "pauseId": "57f0f288-62c8-4c2a-bd94-a76888c71116",
    "argumentValues": [
      {
        "value": "This is a warning at"
      },
      {
        "object": "1"
      }
    ],
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 27,
              "line": 35,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 35,
              "column": 27
            }
          ],
          "functionName": "printWarning",
          "location": [
            {
              "column": 16,
              "line": 36,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 36,
              "column": 16
            }
          ],
          "scopeChain": [
            "3",
            "4",
            "5"
          ],
          "this": {
            "object": "6"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Date",
          "objectId": "1",
          "preview": {
            "dateTime": 1657042901717,
            "prototypeId": "2"
          }
        },
        {
          "className": "Window",
          "objectId": "6"
        },
        {
          "className": "Date.prototype",
          "objectId": "2"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "info",
    "text": "",
    "point": {
      "point": "6814889626827148035730022741311591",
      "time": 3050,
      "frame": [
        {
          "column": 18,
          "line": 41,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 41,
          "column": 18
        }
      ]
    },
    "pauseId": "6dbe0277-52f6-4f6b-be04-8fd4dbb77a5e",
    "argumentValues": [
      {
        "value": "All warnings printed"
      }
    ],
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 27,
              "line": 35,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 35,
              "column": 27
            }
          ],
          "functionName": "printWarning",
          "location": [
            {
              "column": 18,
              "line": 41,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 41,
              "column": 18
            }
          ],
          "scopeChain": [
            "1",
            "2",
            "3"
          ],
          "this": {
            "object": "4"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Window",
          "objectId": "4"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "info",
    "text": "",
    "point": {
      "point": "7788445287802432827765509230428264",
      "time": 3589,
      "frame": [
        {
          "column": 16,
          "line": 26,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 26,
          "column": 16
        }
      ]
    },
    "pauseId": "9a0b018b-4224-4569-bba1-0639ff7f360a",
    "argumentValues": [
      {
        "value": "This is a console log"
      }
    ],
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 23,
              "line": 25,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 25,
              "column": 23
            }
          ],
          "functionName": "printLog",
          "location": [
            {
              "column": 16,
              "line": 26,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 26,
              "column": 16
            }
          ],
          "scopeChain": [
            "1",
            "2",
            "3"
          ],
          "this": {
            "object": "4"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Window",
          "objectId": "4"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "info",
    "text": "",
    "point": {
      "point": "8112963841460865319156188285239401",
      "time": 3937,
      "frame": [
        {
          "column": 16,
          "line": 26,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 26,
          "column": 16
        }
      ]
    },
    "pauseId": "ac31f549-665d-4620-ac08-84e71a142529",
    "argumentValues": [
      {
        "value": "This is a console log"
      }
    ],
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 23,
              "line": 25,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 25,
              "column": 23
            }
          ],
          "functionName": "printLog",
          "location": [
            {
              "column": 16,
              "line": 26,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 26,
              "column": 16
            }
          ],
          "scopeChain": [
            "1",
            "2",
            "3"
          ],
          "this": {
            "object": "4"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Window",
          "objectId": "4"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "info",
    "text": "",
    "point": {
      "point": "8762000948777724537330023360626794",
      "time": 4486,
      "frame": [
        {
          "column": 16,
          "line": 26,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 26,
          "column": 16
        }
      ]
    },
    "pauseId": "197a9462-2af6-49d0-9333-d90c6ada6c5c",
    "argumentValues": [
      {
        "value": "This is a console log"
      }
    ],
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 23,
              "line": 25,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 25,
              "column": 23
            }
          ],
          "functionName": "printLog",
          "location": [
            {
              "column": 16,
              "line": 26,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 26,
              "column": 16
            }
          ],
          "scopeChain": [
            "1",
            "2",
            "3"
          ],
          "this": {
            "object": "4"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Window",
          "objectId": "4"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "info",
    "text": "",
    "point": {
      "point": "10060075163411437209070170477166699",
      "time": 5697,
      "frame": [
        {
          "column": 16,
          "line": 26,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 26,
          "column": 16
        }
      ]
    },
    "pauseId": "a0c00f7d-1b4b-45fb-af54-5ca922656ba5",
    "argumentValues": [
      {
        "value": "This is a console log"
      }
    ],
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 23,
              "line": 25,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 25,
              "column": 23
            }
          ],
          "functionName": "printLog",
          "location": [
            {
              "column": 16,
              "line": 26,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 26,
              "column": 16
            }
          ],
          "scopeChain": [
            "1",
            "2",
            "3"
          ],
          "this": {
            "object": "4"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Window",
          "objectId": "4"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "info",
    "text": "",
    "point": {
      "point": "10384593717069869700460849531977836",
      "time": 6252,
      "frame": [
        {
          "column": 16,
          "line": 26,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 26,
          "column": 16
        }
      ]
    },
    "pauseId": "1c5ec603-1b67-4ab1-b0fd-5e72e71f9259",
    "argumentValues": [
      {
        "value": "This is a console log"
      }
    ],
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 23,
              "line": 25,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 25,
              "column": 23
            }
          ],
          "functionName": "printLog",
          "location": [
            {
              "column": 16,
              "line": 26,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 26,
              "column": 16
            }
          ],
          "scopeChain": [
            "1",
            "2",
            "3"
          ],
          "this": {
            "object": "4"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Window",
          "objectId": "4"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "info",
    "text": "",
    "point": {
      "point": "11682667931703582372200996648517741",
      "time": 7211,
      "frame": [
        {
          "column": 16,
          "line": 26,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 26,
          "column": 16
        }
      ]
    },
    "pauseId": "91e5eda1-e780-424b-bb0f-3a1af038a162",
    "argumentValues": [
      {
        "value": "This is a console log"
      }
    ],
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 23,
              "line": 25,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 25,
              "column": 23
            }
          ],
          "functionName": "printLog",
          "location": [
            {
              "column": 16,
              "line": 26,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 26,
              "column": 16
            }
          ],
          "scopeChain": [
            "1",
            "2",
            "3"
          ],
          "this": {
            "object": "4"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Window",
          "objectId": "4"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "info",
    "text": "",
    "point": {
      "point": "12980742146337295043941143765057646",
      "time": 8289,
      "frame": [
        {
          "column": 16,
          "line": 26,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 26,
          "column": 16
        }
      ]
    },
    "pauseId": "604760d8-f6ee-4ec0-8519-b2313a50aa24",
    "argumentValues": [
      {
        "value": "This is a console log"
      }
    ],
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 23,
              "line": 25,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 25,
              "column": 23
            }
          ],
          "functionName": "printLog",
          "location": [
            {
              "column": 16,
              "line": 26,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 26,
              "column": 16
            }
          ],
          "scopeChain": [
            "1",
            "2",
            "3"
          ],
          "this": {
            "object": "4"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Window",
          "objectId": "4"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "info",
    "text": "",
    "point": {
      "point": "12980742146337296196862648371904623",
      "time": 8293,
      "frame": [
        {
          "column": 18,
          "line": 31,
          "sourceId": "2"
        },
        {
          "sourceId": "h1",
          "line": 31,
          "column": 18
        }
      ]
    },
    "pauseId": "a689f710-73ac-41cd-801b-ae36509fd5f5",
    "argumentValues": [
      {
        "value": "All logs printed"
      }
    ],
    "stack": [
      "0"
    ],
    "data": {
      "frames": [
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 23,
              "line": 25,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 25,
              "column": 23
            }
          ],
          "functionName": "printLog",
          "location": [
            {
              "column": 18,
              "line": 31,
              "sourceId": "2"
            },
            {
              "sourceId": "h1",
              "line": 31,
              "column": 18
            }
          ],
          "scopeChain": [
            "1",
            "2",
            "3"
          ],
          "this": {
            "object": "4"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Window",
          "objectId": "4"
        }
      ]
    }
  }
],
"overflow": false
}
},
{
"args": [
"2",
"04bcee07-a3d4-4ea7-8302-fff594e62fc6",
"canOverflow"
],
"isAsync": true,
"method": "getObjectWithPreview",
"result": {
"objects": [
  {
    "className": "Date.prototype",
    "objectId": "2",
    "preview": {
      "properties": [
        {
          "flags": 3,
          "name": "getTime",
          "object": "8"
        },
        {
          "flags": 3,
          "name": "getTimezoneOffset",
          "object": "9"
        },
        {
          "flags": 3,
          "name": "getYear",
          "object": "10"
        },
        {
          "flags": 3,
          "name": "getFullYear",
          "object": "11"
        },
        {
          "flags": 3,
          "name": "getUTCFullYear",
          "object": "12"
        },
        {
          "flags": 3,
          "name": "getMonth",
          "object": "13"
        },
        {
          "flags": 3,
          "name": "getUTCMonth",
          "object": "14"
        },
        {
          "flags": 3,
          "name": "getDate",
          "object": "15"
        },
        {
          "flags": 3,
          "name": "getUTCDate",
          "object": "16"
        },
        {
          "flags": 3,
          "name": "getDay",
          "object": "17"
        },
        {
          "flags": 3,
          "name": "getUTCDay",
          "object": "18"
        },
        {
          "flags": 3,
          "name": "getHours",
          "object": "19"
        },
        {
          "flags": 3,
          "name": "getUTCHours",
          "object": "20"
        },
        {
          "flags": 3,
          "name": "getMinutes",
          "object": "21"
        },
        {
          "flags": 3,
          "name": "getUTCMinutes",
          "object": "22"
        },
        {
          "flags": 3,
          "name": "getSeconds",
          "object": "23"
        },
        {
          "flags": 3,
          "name": "getUTCSeconds",
          "object": "24"
        },
        {
          "flags": 3,
          "name": "getMilliseconds",
          "object": "25"
        },
        {
          "flags": 3,
          "name": "getUTCMilliseconds",
          "object": "26"
        },
        {
          "flags": 3,
          "name": "setTime",
          "object": "27"
        },
        {
          "flags": 3,
          "name": "setYear",
          "object": "28"
        },
        {
          "flags": 3,
          "name": "setFullYear",
          "object": "29"
        },
        {
          "flags": 3,
          "name": "setUTCFullYear",
          "object": "30"
        },
        {
          "flags": 3,
          "name": "setMonth",
          "object": "31"
        },
        {
          "flags": 3,
          "name": "setUTCMonth",
          "object": "32"
        },
        {
          "flags": 3,
          "name": "setDate",
          "object": "33"
        },
        {
          "flags": 3,
          "name": "setUTCDate",
          "object": "34"
        },
        {
          "flags": 3,
          "name": "setHours",
          "object": "35"
        },
        {
          "flags": 3,
          "name": "setUTCHours",
          "object": "36"
        },
        {
          "flags": 3,
          "name": "setMinutes",
          "object": "37"
        },
        {
          "flags": 3,
          "name": "setUTCMinutes",
          "object": "38"
        },
        {
          "flags": 3,
          "name": "setSeconds",
          "object": "39"
        },
        {
          "flags": 3,
          "name": "setUTCSeconds",
          "object": "40"
        },
        {
          "flags": 3,
          "name": "setMilliseconds",
          "object": "41"
        },
        {
          "flags": 3,
          "name": "setUTCMilliseconds",
          "object": "42"
        },
        {
          "flags": 3,
          "name": "toUTCString",
          "object": "43"
        },
        {
          "flags": 3,
          "name": "toLocaleString",
          "object": "44"
        },
        {
          "flags": 3,
          "name": "toLocaleDateString",
          "object": "45"
        },
        {
          "flags": 3,
          "name": "toLocaleTimeString",
          "object": "46"
        },
        {
          "flags": 3,
          "name": "toDateString",
          "object": "47"
        },
        {
          "flags": 3,
          "name": "toTimeString",
          "object": "48"
        },
        {
          "flags": 3,
          "name": "toISOString",
          "object": "49"
        },
        {
          "flags": 3,
          "name": "toJSON",
          "object": "50"
        },
        {
          "flags": 3,
          "name": "toString",
          "object": "51"
        },
        {
          "flags": 3,
          "name": "valueOf",
          "object": "52"
        },
        {
          "flags": 3,
          "name": "constructor",
          "object": "53"
        },
        {
          "flags": 3,
          "name": "toGMTString",
          "object": "43"
        },
        {
          "flags": 2,
          "isSymbol": true,
          "name": "Symbol(Symbol.toPrimitive)",
          "object": "54"
        }
      ],
      "prototypeId": "7"
    }
  },
  {
    "className": "Object",
    "objectId": "7"
  },
  {
    "className": "Function",
    "objectId": "8",
    "preview": {
      "functionName": "getTime",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "getTime"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "55"
  },
  {
    "className": "Function",
    "objectId": "9",
    "preview": {
      "functionName": "getTimezoneOffset",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "getTimezoneOffset"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "10",
    "preview": {
      "functionName": "getYear",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "getYear"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "11",
    "preview": {
      "functionName": "getFullYear",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "getFullYear"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "12",
    "preview": {
      "functionName": "getUTCFullYear",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "getUTCFullYear"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "13",
    "preview": {
      "functionName": "getMonth",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "getMonth"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "14",
    "preview": {
      "functionName": "getUTCMonth",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "getUTCMonth"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "15",
    "preview": {
      "functionName": "getDate",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "getDate"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "16",
    "preview": {
      "functionName": "getUTCDate",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "getUTCDate"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "17",
    "preview": {
      "functionName": "getDay",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "getDay"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "18",
    "preview": {
      "functionName": "getUTCDay",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "getUTCDay"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "19",
    "preview": {
      "functionName": "getHours",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "getHours"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "20",
    "preview": {
      "functionName": "getUTCHours",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "getUTCHours"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "21",
    "preview": {
      "functionName": "getMinutes",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "getMinutes"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "22",
    "preview": {
      "functionName": "getUTCMinutes",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "getUTCMinutes"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "23",
    "preview": {
      "functionName": "getSeconds",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "getSeconds"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "24",
    "preview": {
      "functionName": "getUTCSeconds",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "getUTCSeconds"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "25",
    "preview": {
      "functionName": "getMilliseconds",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "getMilliseconds"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "26",
    "preview": {
      "functionName": "getUTCMilliseconds",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "getUTCMilliseconds"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "27",
    "preview": {
      "functionName": "setTime",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 1
        },
        {
          "flags": 2,
          "name": "name",
          "value": "setTime"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "28",
    "preview": {
      "functionName": "setYear",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 1
        },
        {
          "flags": 2,
          "name": "name",
          "value": "setYear"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "29",
    "preview": {
      "functionName": "setFullYear",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 3
        },
        {
          "flags": 2,
          "name": "name",
          "value": "setFullYear"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "30",
    "preview": {
      "functionName": "setUTCFullYear",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 3
        },
        {
          "flags": 2,
          "name": "name",
          "value": "setUTCFullYear"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "31",
    "preview": {
      "functionName": "setMonth",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 2
        },
        {
          "flags": 2,
          "name": "name",
          "value": "setMonth"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "32",
    "preview": {
      "functionName": "setUTCMonth",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 2
        },
        {
          "flags": 2,
          "name": "name",
          "value": "setUTCMonth"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "33",
    "preview": {
      "functionName": "setDate",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 1
        },
        {
          "flags": 2,
          "name": "name",
          "value": "setDate"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "34",
    "preview": {
      "functionName": "setUTCDate",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 1
        },
        {
          "flags": 2,
          "name": "name",
          "value": "setUTCDate"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "35",
    "preview": {
      "functionName": "setHours",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 4
        },
        {
          "flags": 2,
          "name": "name",
          "value": "setHours"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "36",
    "preview": {
      "functionName": "setUTCHours",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 4
        },
        {
          "flags": 2,
          "name": "name",
          "value": "setUTCHours"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "37",
    "preview": {
      "functionName": "setMinutes",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 3
        },
        {
          "flags": 2,
          "name": "name",
          "value": "setMinutes"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "38",
    "preview": {
      "functionName": "setUTCMinutes",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 3
        },
        {
          "flags": 2,
          "name": "name",
          "value": "setUTCMinutes"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "39",
    "preview": {
      "functionName": "setSeconds",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 2
        },
        {
          "flags": 2,
          "name": "name",
          "value": "setSeconds"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "40",
    "preview": {
      "functionName": "setUTCSeconds",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 2
        },
        {
          "flags": 2,
          "name": "name",
          "value": "setUTCSeconds"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "41",
    "preview": {
      "functionName": "setMilliseconds",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 1
        },
        {
          "flags": 2,
          "name": "name",
          "value": "setMilliseconds"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "42",
    "preview": {
      "functionName": "setUTCMilliseconds",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 1
        },
        {
          "flags": 2,
          "name": "name",
          "value": "setUTCMilliseconds"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "43",
    "preview": {
      "functionName": "toUTCString",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "toUTCString"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "44",
    "preview": {
      "functionName": "toLocaleString",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "toLocaleString"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "45",
    "preview": {
      "functionName": "toLocaleDateString",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "toLocaleDateString"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "46",
    "preview": {
      "functionName": "toLocaleTimeString",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "toLocaleTimeString"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "47",
    "preview": {
      "functionName": "toDateString",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "toDateString"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "48",
    "preview": {
      "functionName": "toTimeString",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "toTimeString"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "49",
    "preview": {
      "functionName": "toISOString",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "toISOString"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "50",
    "preview": {
      "functionName": "toJSON",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 1
        },
        {
          "flags": 2,
          "name": "name",
          "value": "toJSON"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "51",
    "preview": {
      "functionName": "toString",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "toString"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "52",
    "preview": {
      "functionName": "valueOf",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "valueOf"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "53",
    "preview": {
      "functionName": "Date",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 3,
          "name": "UTC",
          "object": "56"
        },
        {
          "flags": 3,
          "name": "parse",
          "object": "57"
        },
        {
          "flags": 3,
          "name": "now",
          "object": "58"
        },
        {
          "flags": 0,
          "name": "prototype",
          "object": "2"
        },
        {
          "flags": 2,
          "name": "length",
          "value": 7
        },
        {
          "flags": 2,
          "name": "name",
          "value": "Date"
        }
      ],
      "prototypeId": "55"
    }
  },
  {
    "className": "Function",
    "objectId": "56"
  },
  {
    "className": "Function",
    "objectId": "57"
  },
  {
    "className": "Function",
    "objectId": "58"
  },
  {
    "className": "Function",
    "objectId": "54",
    "preview": {
      "functionName": "[Symbol.toPrimitive]",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 2,
          "name": "length",
          "value": 1
        },
        {
          "flags": 2,
          "name": "name",
          "value": "[Symbol.toPrimitive]"
        }
      ],
      "prototypeId": "55"
    }
  }
]
}
},
{
"args": [
"h1"
],
"isAsync": true,
"method": "getSourceHitCounts",
"result": {
"dataType": "Map",
"value": [
  [
    11,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 11,
            "column": 26
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    12,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 12,
            "column": 24
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    13,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 13,
            "column": 28
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    54,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 54,
            "column": 6
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 54,
            "column": 30
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    55,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 55,
            "column": 6
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 55,
            "column": 30
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    56,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 56,
            "column": 6
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 56,
            "column": 30
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    57,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 57,
            "column": 6
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 57,
            "column": 30
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    60,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 60,
            "column": 6
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 60,
            "column": 14
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    61,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 61,
            "column": 4
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    16,
    {
      "columnHits": [
        {
          "hits": 2,
          "location": {
            "sourceId": "h1",
            "line": 16,
            "column": 8
          }
        },
        {
          "hits": 2,
          "location": {
            "sourceId": "h1",
            "line": 16,
            "column": 16
          }
        }
      ],
      "hits": 4
    }
  ],
  [
    18,
    {
      "columnHits": [
        {
          "hits": 2,
          "location": {
            "sourceId": "h1",
            "line": 18,
            "column": 12
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    19,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 19,
            "column": 10
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 19,
            "column": 34
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    21,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 21,
            "column": 10
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 21,
            "column": 18
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    23,
    {
      "columnHits": [
        {
          "hits": 2,
          "location": {
            "sourceId": "h1",
            "line": 23,
            "column": 6
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    26,
    {
      "columnHits": [
        {
          "hits": 10,
          "location": {
            "sourceId": "h1",
            "line": 26,
            "column": 8
          }
        },
        {
          "hits": 10,
          "location": {
            "sourceId": "h1",
            "line": 26,
            "column": 16
          }
        }
      ],
      "hits": 20
    }
  ],
  [
    28,
    {
      "columnHits": [
        {
          "hits": 10,
          "location": {
            "sourceId": "h1",
            "line": 28,
            "column": 12
          }
        }
      ],
      "hits": 10
    }
  ],
  [
    29,
    {
      "columnHits": [
        {
          "hits": 9,
          "location": {
            "sourceId": "h1",
            "line": 29,
            "column": 10
          }
        },
        {
          "hits": 9,
          "location": {
            "sourceId": "h1",
            "line": 29,
            "column": 34
          }
        }
      ],
      "hits": 18
    }
  ],
  [
    31,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 31,
            "column": 10
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 31,
            "column": 18
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    33,
    {
      "columnHits": [
        {
          "hits": 10,
          "location": {
            "sourceId": "h1",
            "line": 33,
            "column": 6
          }
        }
      ],
      "hits": 10
    }
  ],
  [
    36,
    {
      "columnHits": [
        {
          "hits": 5,
          "location": {
            "sourceId": "h1",
            "line": 36,
            "column": 8
          }
        },
        {
          "hits": 5,
          "location": {
            "sourceId": "h1",
            "line": 36,
            "column": 45
          }
        },
        {
          "hits": 5,
          "location": {
            "sourceId": "h1",
            "line": 36,
            "column": 16
          }
        }
      ],
      "hits": 15
    }
  ],
  [
    38,
    {
      "columnHits": [
        {
          "hits": 5,
          "location": {
            "sourceId": "h1",
            "line": 38,
            "column": 12
          }
        }
      ],
      "hits": 5
    }
  ],
  [
    39,
    {
      "columnHits": [
        {
          "hits": 4,
          "location": {
            "sourceId": "h1",
            "line": 39,
            "column": 10
          }
        },
        {
          "hits": 4,
          "location": {
            "sourceId": "h1",
            "line": 39,
            "column": 34
          }
        }
      ],
      "hits": 8
    }
  ],
  [
    41,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 41,
            "column": 10
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 41,
            "column": 18
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    43,
    {
      "columnHits": [
        {
          "hits": 5,
          "location": {
            "sourceId": "h1",
            "line": 43,
            "column": 6
          }
        }
      ],
      "hits": 5
    }
  ],
  [
    46,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 46,
            "column": 8
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 46,
            "column": 14
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    47,
    {
      "columnHits": [
        {
          "hits": 0,
          "location": {
            "sourceId": "h1",
            "line": 47,
            "column": 6
          }
        }
      ],
      "hits": 0
    }
  ],
  [
    50,
    {
      "columnHits": [
        {
          "hits": 18,
          "location": {
            "sourceId": "h1",
            "line": 50,
            "column": 22
          }
        },
        {
          "hits": 18,
          "location": {
            "sourceId": "h1",
            "line": 50,
            "column": 44
          }
        },
        {
          "hits": 18,
          "location": {
            "sourceId": "h1",
            "line": 50,
            "column": 27
          }
        }
      ],
      "hits": 54
    }
  ],
  [
    51,
    {
      "columnHits": [
        {
          "hits": 18,
          "location": {
            "sourceId": "h1",
            "line": 51,
            "column": 8
          }
        },
        {
          "hits": 18,
          "location": {
            "sourceId": "h1",
            "line": 51,
            "column": 18
          }
        }
      ],
      "hits": 36
    }
  ],
  [
    52,
    {
      "columnHits": [
        {
          "hits": 18,
          "location": {
            "sourceId": "h1",
            "line": 52,
            "column": 6
          }
        }
      ],
      "hits": 18
    }
  ]
]
}
},
{
"args": [
"h1"
],
"isAsync": true,
"method": "getSourceContents",
"result": {
"contents": "<!DOCTYPE html>\\n<html>\\n  <head>\\n    <meta charset=\\"utf-8\\" />\\n    <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />\\n    <title></title>\\n  </head>\\n  <body>\\n    <script type=\\"text/javascript\\" src=\\"https://unpkg.com/react-is@18.2.0/umd/react-is.development.js\\"></script>\\n    <script type=\\"text/javascript\\">\\n      let errorsToPrint = 2;\\n      let logsToPrint = 10;\\n      let warningsToPrint = 5;\\n\\n      function printError() {\\n        console.error(\\"This is an error for URL\\", window.location.href);\\n\\n        if (--errorsToPrint > 0) {\\n          callbackAfterRandomDelay(printError);\\n        } else {\\n          console.trace('All errors printed');\\n        }\\n      }\\n\\n      function printLog() {\\n        console.log(\\"This is a console log\\");\\n\\n        if (--logsToPrint > 0) {\\n          callbackAfterRandomDelay(printLog);\\n        } else {\\n          console.info('All logs printed');\\n        }\\n      }\\n      \\n      function printWarning() {\\n        console.warn(\\"This is a warning at\\", new Date());\\n\\n        if (--warningsToPrint > 0) {\\n          callbackAfterRandomDelay(printWarning);\\n        } else {\\n          console.info('All warnings printed');\\n        }\\n      }\\n      \\n      function throwException() {\\n        throw Error(\\"This is an exception\\");\\n      }\\n\\n      function callbackAfterRandomDelay(callback) {\\n        const delay = Math.round(250 + Math.random() * 1000);\\n        setTimeout(callback, delay);\\n      }\\n\\n      callbackAfterRandomDelay(printError);\\n      callbackAfterRandomDelay(printLog);\\n      callbackAfterRandomDelay(printWarning);\\n      callbackAfterRandomDelay(throwException);\\n\\n      // Trigger a warning from node_modules\\n      ReactIs.isAsyncMode({});\\n    </script>\\n  </body>\\n</html>\\n",
"contentType": "text/html"
}
},
{
"args": [
{
  "column": 6,
  "line": 54,
  "sourceId": "h1"
}
],
"isAsync": true,
"method": "getHitPointsForLocation",
"result": [
{
  "point": "324518553658457855663750340673731",
  "time": 118.6,
  "frame": [
    {
      "sourceId": "2",
      "line": 54,
      "column": 6,
      "functionId": "20",
      "offset": 195
    },
    {
      "sourceId": "h1",
      "line": 54,
      "column": 6
    }
  ]
}
]
},
{
"args": [
{
  "column": 6,
  "line": 54,
  "sourceId": "h1"
},
{
  "point": "324518553658457855663750340673731",
  "time": 118.6,
  "frame": [
    {
      "sourceId": "2",
      "line": 54,
      "column": 6,
      "functionId": "20",
      "offset": 195
    },
    {
      "sourceId": "h1",
      "line": 54,
      "column": 6
    }
  ]
},
"\\n    const finalData = { frames: [], scopes: [], objects: [] };\\n    function addPauseData({ frames, scopes, objects }) {\\n          finalData.frames.push(...(frames || []));\\n          finalData.scopes.push(...(scopes || []));\\n          finalData.objects.push(...(objects || []));\\n    }\\n    function getTopFrame() {\\n          const { frame, data } = sendCommand(\\"Pause.getTopFrame\\");\\n      addPauseData(data);\\n      return finalData.frames.find(f => f.frameId == frame);\\n    }\\n\\n      const { point, time, pauseId } = input;\\n      const { frameId, functionName, location } = getTopFrame();\\n\\n      const bindings = [\\n            { name: \\"displayName\\", value: functionName || \\"\\" }\\n      ];\\n      const { result } = sendCommand(\\"Pause.evaluateInFrame\\", {\\n            frameId,\\n            bindings,\\n            expression: \\"[\\" + \\"\\\\\\"errorsToPrint:\\\\\\", errorsToPrint\\" + \\"]\\",\\n        useOriginalScopes: true,\\n      });\\n      const values = [];\\n      addPauseData(result.data);\\n      if (result.exception) {\\n            values.push(result.exception);\\n      } else {\\n            {\\n          const { object } = result.returned;\\n      const { result: lengthResult } = sendCommand(\\n            \\"Pause.getObjectProperty\\",\\n        { object, name: \\"length\\" }\\n      );\\n      addPauseData(lengthResult.data);\\n      const length = lengthResult.returned.value;\\n      for (let i = 0; i < length; i++) {\\n            const { result: elementResult } = sendCommand(\\n              \\"Pause.getObjectProperty\\",\\n          { object, name: i.toString() }\\n        );\\n        values.push(elementResult.returned);\\n        addPauseData(elementResult.data);\\n      }\\n    }\\n      }\\n      return [{\\n            key: point,\\n            value: { time, pauseId, location, values, data: finalData },\\n      }];\\n    "
],
"isAsync": true,
"method": "runAnalysis",
"result": {
"time": 118.6,
"pauseId": "9eabc310-894a-475a-a07a-5d36648c419d",
"location": [
  {
    "sourceId": "2",
    "line": 54,
    "column": 6,
    "functionId": "20",
    "offset": 195
  },
  {
    "sourceId": "h1",
    "line": 54,
    "column": 6
  }
],
"values": [
  {
    "value": "errorsToPrint:"
  },
  {
    "value": 2
  }
],
"data": {
  "frames": [
    {
      "frameId": "0",
      "location": [
        {
          "sourceId": "2",
          "line": 54,
          "column": 6,
          "functionId": "20",
          "offset": 195
        },
        {
          "sourceId": "h1",
          "line": 54,
          "column": 6
        }
      ],
      "scopeChain": [
        "1",
        "2"
      ],
      "this": {
        "object": "3"
      },
      "type": "global"
    }
  ],
  "scopes": [],
  "objects": [
    {
      "className": "Window",
      "objectId": "3"
    },
    {
      "className": "Array",
      "objectId": "4",
      "preview": {
        "getterValues": [
          {
            "name": "length",
            "value": 2
          }
        ],
        "properties": [
          {
            "name": "0",
            "value": "errorsToPrint:"
          },
          {
            "name": "1",
            "value": 2
          },
          {
            "flags": 1,
            "name": "length",
            "value": 2
          }
        ],
        "prototypeId": "5"
      }
    },
    {
      "className": "Array",
      "objectId": "5"
    }
  ]
}
}
}
]`)
);

export default function ConsoleLevels() {
  return (
    <ReplayClientContext.Provider value={replayClientPlayer}>
      <Initializer accessToken={ACCESS_TOKEN} recordingId={RECORDING_ID}>
        <PointsContextRoot>
          <PauseContextRoot>
            <FocusContextRoot>
              <div className={styles.HorizontalContainer}>
                <div className={styles.VerticalContainer}>
                  <ConsoleRoot />
                </div>
              </div>
            </FocusContextRoot>
          </PauseContextRoot>
        </PointsContextRoot>
      </Initializer>
    </ReplayClientContext.Provider>
  );
}
