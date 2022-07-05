import ConsoleRoot from "@bvaughn/components/console";
import Initializer from "@bvaughn/components/Initializer";
import Sources from "@bvaughn/components/sources/Sources";
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
"result": "1b123528-894b-4ff9-bccd-1af74a5b9ab2/3e21e5d9-6464-4ed3-b726-554dfaad53f8"
},
{
"args": [
"1b123528-894b-4ff9-bccd-1af74a5b9ab2/3e21e5d9-6464-4ed3-b726-554dfaad53f8"
],
"isAsync": true,
"method": "getSessionEndpoint",
"result": {
"point": "5516815412193419223088811128913920",
"time": 2587
}
},
{
"args": [],
"isAsync": true,
"method": "findSources",
"result": [
{
  "sourceId": "h1",
  "contentHash": "60f930ec90334ecfc96184af873eccac67accf96b84fbe2040878ffe59f1d437",
  "generatedSourceIds": [
    "1"
  ],
  "kind": "html",
  "url": "file:///Users/bvaughn/Desktop/temp-error-stack.html"
},
{
  "sourceId": "1",
  "contentHash": "a8689f9b049aef848e59c9b153a777038c819a8c228d5fe48e6faa6c06b8eb35",
  "kind": "inlineScript",
  "url": "file:///Users/bvaughn/Desktop/temp-error-stack.html"
}
]
},
{
"args": [
"h1"
],
"isAsync": true,
"method": "gitSourceHitCounts",
"result": {
"dataType": "Map",
"value": [
  [
    25,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 25,
            "column": 2
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
            "sourceId": "h1",
            "line": 11,
            "column": 4
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 11,
            "column": 12
          }
        }
      ],
      "hits": 2
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
            "column": 4
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
            "column": 2
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
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 16,
            "column": 4
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 16,
            "column": 12
          }
        }
      ],
      "hits": 2
    }
  ],
  [
    17,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 17,
            "column": 4
          }
        }
      ],
      "hits": 1
    }
  ],
  [
    18,
    {
      "columnHits": [
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 18,
            "column": 2
          }
        }
      ],
      "hits": 1
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
            "column": 4
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 21,
            "column": 12
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
            "sourceId": "h1",
            "line": 22,
            "column": 4
          }
        },
        {
          "hits": 1,
          "location": {
            "sourceId": "h1",
            "line": 22,
            "column": 12
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
            "sourceId": "h1",
            "line": 23,
            "column": 2
          }
        }
      ],
      "hits": 1
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
"contents": "<!DOCTYPE html>\\n<html>\\n<head>\\n  <meta charset=\\"utf-8\\">\\n  <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\">\\n  <title></title>\\n</head>\\n<body>\\n<script type=\\"text/javascript\\">\\n  function foo() {\\n    console.log(\\"This is a log\\");\\n    bar();\\n  }\\n\\n  function bar() {\\n    console.warn(\\"This is a warning\\", [1,2,3]);\\n    baz();\\n  }\\n\\n  function baz() {\\n    console.error(\\"This is an error\\", {foo, number: 123, string: 'abc'});\\n    console.trace(\\"This is a trace\\");\\n  }\\n\\n  foo();\\n</script>\\n</body>\\n</html>",
"contentType": "text/html"
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
    "level": "info",
    "text": "",
    "point": {
      "point": "11529215046068469768",
      "time": 49,
      "frame": [
        {
          "sourceId": "1",
          "line": 11,
          "column": 12,
          "functionId": "2",
          "offset": 118
        },
        {
          "sourceId": "h1",
          "line": 11,
          "column": 12
        }
      ]
    },
    "pauseId": "5a2131c2-d6de-463a-b63c-db875afa3457",
    "argumentValues": [
      {
        "value": "This is a log"
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
              "sourceId": "1",
              "line": 25,
              "column": 2,
              "functionId": "1",
              "offset": 72
            },
            {
              "sourceId": "h1",
              "line": 25,
              "column": 2
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
              "column": 14,
              "line": 10,
              "sourceId": "1"
            },
            {
              "sourceId": "h1",
              "line": 10,
              "column": 14
            }
          ],
          "functionName": "foo",
          "location": [
            {
              "sourceId": "1",
              "line": 11,
              "column": 12,
              "functionId": "2",
              "offset": 118
            },
            {
              "sourceId": "h1",
              "line": 11,
              "column": 12
            }
          ],
          "scopeChain": [
            "4",
            "1",
            "2"
          ],
          "this": {
            "object": "3"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Window",
          "objectId": "3"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "warning",
    "text": "",
    "point": {
      "point": "13835058055282163721",
      "time": 49,
      "frame": [
        {
          "sourceId": "1",
          "line": 16,
          "column": 12,
          "functionId": "3",
          "offset": 143
        },
        {
          "sourceId": "h1",
          "line": 16,
          "column": 12
        }
      ]
    },
    "pauseId": "dd36aff5-8ddf-484a-9581-a6800c4c4211",
    "argumentValues": [
      {
        "value": "This is a warning"
      },
      {
        "object": "1"
      }
    ],
    "stack": [
      "0",
      "1",
      "2"
    ],
    "data": {
      "frames": [
        {
          "frameId": "2",
          "location": [
            {
              "sourceId": "1",
              "line": 25,
              "column": 2,
              "functionId": "1",
              "offset": 72
            },
            {
              "sourceId": "h1",
              "line": 25,
              "column": 2
            }
          ],
          "scopeChain": [
            "3",
            "4"
          ],
          "this": {
            "object": "5"
          },
          "type": "global"
        },
        {
          "frameId": "1",
          "functionLocation": [
            {
              "column": 14,
              "line": 10,
              "sourceId": "1"
            },
            {
              "sourceId": "h1",
              "line": 10,
              "column": 14
            }
          ],
          "functionName": "foo",
          "location": [
            {
              "sourceId": "1",
              "line": 12,
              "column": 4,
              "functionId": "2",
              "offset": 155
            },
            {
              "sourceId": "h1",
              "line": 12,
              "column": 4
            }
          ],
          "scopeChain": [
            "6",
            "3",
            "4"
          ],
          "this": {
            "object": "5"
          },
          "type": "call"
        },
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 14,
              "line": 15,
              "sourceId": "1"
            },
            {
              "sourceId": "h1",
              "line": 15,
              "column": 14
            }
          ],
          "functionName": "bar",
          "location": [
            {
              "sourceId": "1",
              "line": 16,
              "column": 12,
              "functionId": "3",
              "offset": 143
            },
            {
              "sourceId": "h1",
              "line": 16,
              "column": 12
            }
          ],
          "scopeChain": [
            "7",
            "3",
            "4"
          ],
          "this": {
            "object": "5"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Array",
          "objectId": "1",
          "preview": {
            "getterValues": [
              {
                "name": "length",
                "value": 3
              }
            ],
            "properties": [
              {
                "name": "0",
                "value": 1
              },
              {
                "name": "1",
                "value": 2
              },
              {
                "name": "2",
                "value": 3
              },
              {
                "flags": 1,
                "name": "length",
                "value": 3
              }
            ],
            "prototypeId": "2"
          }
        },
        {
          "className": "Window",
          "objectId": "5"
        },
        {
          "className": "Array",
          "objectId": "2"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "error",
    "text": "",
    "point": {
      "point": "16140901064495857674",
      "time": 49,
      "frame": [
        {
          "sourceId": "1",
          "line": 21,
          "column": 12,
          "functionId": "4",
          "offset": 150
        },
        {
          "sourceId": "h1",
          "line": 21,
          "column": 12
        }
      ]
    },
    "pauseId": "e6c8c487-593b-4dd5-a079-10b8b3656d92",
    "argumentValues": [
      {
        "value": "This is an error"
      },
      {
        "object": "1"
      }
    ],
    "stack": [
      "0",
      "1",
      "2",
      "3"
    ],
    "data": {
      "frames": [
        {
          "frameId": "3",
          "location": [
            {
              "sourceId": "1",
              "line": 25,
              "column": 2,
              "functionId": "1",
              "offset": 72
            },
            {
              "sourceId": "h1",
              "line": 25,
              "column": 2
            }
          ],
          "scopeChain": [
            "4",
            "5"
          ],
          "this": {
            "object": "6"
          },
          "type": "global"
        },
        {
          "frameId": "2",
          "functionLocation": [
            {
              "column": 14,
              "line": 10,
              "sourceId": "1"
            },
            {
              "sourceId": "h1",
              "line": 10,
              "column": 14
            }
          ],
          "functionName": "foo",
          "location": [
            {
              "sourceId": "1",
              "line": 12,
              "column": 4,
              "functionId": "2",
              "offset": 155
            },
            {
              "sourceId": "h1",
              "line": 12,
              "column": 4
            }
          ],
          "scopeChain": [
            "7",
            "4",
            "5"
          ],
          "this": {
            "object": "6"
          },
          "type": "call"
        },
        {
          "frameId": "1",
          "functionLocation": [
            {
              "column": 14,
              "line": 15,
              "sourceId": "1"
            },
            {
              "sourceId": "h1",
              "line": 15,
              "column": 14
            }
          ],
          "functionName": "bar",
          "location": [
            {
              "sourceId": "1",
              "line": 17,
              "column": 4,
              "functionId": "3",
              "offset": 180
            },
            {
              "sourceId": "h1",
              "line": 17,
              "column": 4
            }
          ],
          "scopeChain": [
            "8",
            "4",
            "5"
          ],
          "this": {
            "object": "6"
          },
          "type": "call"
        },
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 14,
              "line": 20,
              "sourceId": "1"
            },
            {
              "sourceId": "h1",
              "line": 20,
              "column": 14
            }
          ],
          "functionName": "baz",
          "location": [
            {
              "sourceId": "1",
              "line": 21,
              "column": 12,
              "functionId": "4",
              "offset": 150
            },
            {
              "sourceId": "h1",
              "line": 21,
              "column": 12
            }
          ],
          "scopeChain": [
            "9",
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
          "className": "Object",
          "objectId": "1",
          "preview": {
            "properties": [
              {
                "name": "foo",
                "object": "3"
              },
              {
                "name": "number",
                "value": 123
              },
              {
                "name": "string",
                "value": "abc"
              }
            ],
            "prototypeId": "2"
          }
        },
        {
          "className": "Window",
          "objectId": "6"
        },
        {
          "className": "Function",
          "objectId": "3"
        },
        {
          "className": "Object",
          "objectId": "2"
        }
      ]
    }
  },
  {
    "source": "ConsoleAPI",
    "level": "trace",
    "text": "",
    "point": {
      "point": "17293822569102704651",
      "time": 49,
      "frame": [
        {
          "sourceId": "1",
          "line": 22,
          "column": 12,
          "functionId": "4",
          "offset": 237
        },
        {
          "sourceId": "h1",
          "line": 22,
          "column": 12
        }
      ]
    },
    "pauseId": "9bad738c-1282-42d4-b786-9de22af93689",
    "argumentValues": [
      {
        "value": "This is a trace"
      }
    ],
    "stack": [
      "0",
      "1",
      "2",
      "3"
    ],
    "data": {
      "frames": [
        {
          "frameId": "3",
          "location": [
            {
              "sourceId": "1",
              "line": 25,
              "column": 2,
              "functionId": "1",
              "offset": 72
            },
            {
              "sourceId": "h1",
              "line": 25,
              "column": 2
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
          "frameId": "2",
          "functionLocation": [
            {
              "column": 14,
              "line": 10,
              "sourceId": "1"
            },
            {
              "sourceId": "h1",
              "line": 10,
              "column": 14
            }
          ],
          "functionName": "foo",
          "location": [
            {
              "sourceId": "1",
              "line": 12,
              "column": 4,
              "functionId": "2",
              "offset": 155
            },
            {
              "sourceId": "h1",
              "line": 12,
              "column": 4
            }
          ],
          "scopeChain": [
            "4",
            "1",
            "2"
          ],
          "this": {
            "object": "3"
          },
          "type": "call"
        },
        {
          "frameId": "1",
          "functionLocation": [
            {
              "column": 14,
              "line": 15,
              "sourceId": "1"
            },
            {
              "sourceId": "h1",
              "line": 15,
              "column": 14
            }
          ],
          "functionName": "bar",
          "location": [
            {
              "sourceId": "1",
              "line": 17,
              "column": 4,
              "functionId": "3",
              "offset": 180
            },
            {
              "sourceId": "h1",
              "line": 17,
              "column": 4
            }
          ],
          "scopeChain": [
            "5",
            "1",
            "2"
          ],
          "this": {
            "object": "3"
          },
          "type": "call"
        },
        {
          "frameId": "0",
          "functionLocation": [
            {
              "column": 14,
              "line": 20,
              "sourceId": "1"
            },
            {
              "sourceId": "h1",
              "line": 20,
              "column": 14
            }
          ],
          "functionName": "baz",
          "location": [
            {
              "sourceId": "1",
              "line": 22,
              "column": 12,
              "functionId": "4",
              "offset": 237
            },
            {
              "sourceId": "h1",
              "line": 22,
              "column": 12
            }
          ],
          "scopeChain": [
            "6",
            "1",
            "2"
          ],
          "this": {
            "object": "3"
          },
          "type": "call"
        }
      ],
      "objects": [
        {
          "className": "Window",
          "objectId": "3"
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
"3",
"e6c8c487-593b-4dd5-a079-10b8b3656d92",
"canOverflow"
],
"isAsync": true,
"method": "getObjectWithPreview",
"result": {
"objects": [
  {
    "className": "Function",
    "objectId": "3",
    "preview": {
      "functionLocation": [
        {
          "column": 14,
          "line": 10,
          "sourceId": "1"
        },
        {
          "sourceId": "h1",
          "line": 10,
          "column": 14
        }
      ],
      "functionName": "foo",
      "functionParameterNames": [],
      "getterValues": [
        {
          "name": "arguments",
          "object": "12"
        },
        {
          "name": "caller",
          "value": null
        }
      ],
      "properties": [
        {
          "flags": 1,
          "name": "prototype",
          "object": "11"
        },
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": "foo"
        }
      ],
      "prototypeId": "10"
    }
  },
  {
    "className": "Function",
    "objectId": "10"
  },
  {
    "className": "Object",
    "objectId": "11",
    "preview": {
      "properties": [
        {
          "flags": 3,
          "name": "constructor",
          "object": "3"
        }
      ],
      "prototypeId": "2"
    }
  },
  {
    "className": "Object",
    "objectId": "2"
  },
  {
    "className": "Arguments",
    "objectId": "12",
    "preview": {
      "properties": [
        {
          "flags": 3,
          "name": "length",
          "value": 0
        },
        {
          "flags": 3,
          "name": "callee",
          "object": "3"
        },
        {
          "flags": 3,
          "isSymbol": true,
          "name": "Symbol(Symbol.iterator)",
          "object": "13"
        }
      ],
      "prototypeId": "2"
    }
  },
  {
    "className": "Function",
    "objectId": "13"
  }
]
}
},
{
"args": [
{
  "column": 4,
  "line": 11,
  "sourceId": "h1"
}
],
"isAsync": true,
"method": "getHitPointsForLocation",
"result": [
{
  "point": "11529214981643960388",
  "time": 48,
  "frame": [
    {
      "sourceId": "1",
      "line": 11,
      "column": 4,
      "functionId": "2",
      "offset": 68
    },
    {
      "sourceId": "h1",
      "line": 11,
      "column": 4
    }
  ]
}
]
},
{
"args": [
{
  "column": 4,
  "line": 11,
  "sourceId": "h1"
},
{
  "point": "11529214981643960388",
  "time": 48,
  "frame": [
    {
      "sourceId": "1",
      "line": 11,
      "column": 4,
      "functionId": "2",
      "offset": 68
    },
    {
      "sourceId": "h1",
      "line": 11,
      "column": 4
    }
  ]
},
"\\n    const finalData = { frames: [], scopes: [], objects: [] };\\n    function addPauseData({ frames, scopes, objects }) {\\n          finalData.frames.push(...(frames || []));\\n          finalData.scopes.push(...(scopes || []));\\n          finalData.objects.push(...(objects || []));\\n    }\\n    function getTopFrame() {\\n          const { frame, data } = sendCommand(\\"Pause.getTopFrame\\");\\n      addPauseData(data);\\n      return finalData.frames.find(f => f.frameId == frame);\\n    }\\n\\n      const { point, time, pauseId } = input;\\n      const { frameId, functionName, location } = getTopFrame();\\n\\n      const bindings = [\\n            { name: \\"displayName\\", value: functionName || \\"\\" }\\n      ];\\n      const { result } = sendCommand(\\"Pause.evaluateInFrame\\", {\\n            frameId,\\n            bindings,\\n            expression: \\"[\\" + \\"window.location\\" + \\"]\\",\\n        useOriginalScopes: true,\\n      });\\n      const values = [];\\n      addPauseData(result.data);\\n      if (result.exception) {\\n            values.push(result.exception);\\n      } else {\\n            {\\n          const { object } = result.returned;\\n      const { result: lengthResult } = sendCommand(\\n            \\"Pause.getObjectProperty\\",\\n        { object, name: \\"length\\" }\\n      );\\n      addPauseData(lengthResult.data);\\n      const length = lengthResult.returned.value;\\n      for (let i = 0; i < length; i++) {\\n            const { result: elementResult } = sendCommand(\\n              \\"Pause.getObjectProperty\\",\\n          { object, name: i.toString() }\\n        );\\n        values.push(elementResult.returned);\\n        addPauseData(elementResult.data);\\n      }\\n    }\\n      }\\n      return [{\\n            key: point,\\n            value: { time, pauseId, location, values, data: finalData },\\n      }];\\n    "
],
"isAsync": true,
"method": "runAnalysis",
"result": {
"time": 48,
"pauseId": "9fb8443d-74b6-495a-b0d5-51fb232ab2f4",
"location": [
  {
    "sourceId": "1",
    "line": 11,
    "column": 4,
    "functionId": "2",
    "offset": 68
  },
  {
    "sourceId": "h1",
    "line": 11,
    "column": 4
  }
],
"values": [
  {
    "object": "7"
  }
],
"data": {
  "frames": [
    {
      "frameId": "0",
      "functionLocation": [
        {
          "column": 14,
          "line": 10,
          "sourceId": "1"
        },
        {
          "sourceId": "h1",
          "line": 10,
          "column": 14
        }
      ],
      "functionName": "foo",
      "location": [
        {
          "sourceId": "1",
          "line": 11,
          "column": 4,
          "functionId": "2",
          "offset": 68
        },
        {
          "sourceId": "h1",
          "line": 11,
          "column": 4
        }
      ],
      "scopeChain": [
        "4",
        "1",
        "2"
      ],
      "this": {
        "object": "3"
      },
      "type": "call"
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
      "objectId": "5",
      "preview": {
        "getterValues": [
          {
            "name": "length",
            "value": 1
          }
        ],
        "properties": [
          {
            "name": "0",
            "object": "7"
          },
          {
            "flags": 1,
            "name": "length",
            "value": 1
          }
        ],
        "prototypeId": "6"
      }
    },
    {
      "className": "Array",
      "objectId": "6"
    },
    {
      "className": "Location",
      "objectId": "7",
      "preview": {
        "getterValues": [],
        "overflow": true,
        "properties": [
          {
            "flags": 4,
            "get": "9",
            "name": "href",
            "set": "10"
          },
          {
            "flags": 4,
            "get": "11",
            "name": "origin"
          },
          {
            "flags": 4,
            "get": "12",
            "name": "protocol",
            "set": "13"
          },
          {
            "flags": 4,
            "get": "14",
            "name": "host",
            "set": "15"
          },
          {
            "flags": 4,
            "get": "16",
            "name": "hostname",
            "set": "17"
          },
          {
            "flags": 4,
            "get": "18",
            "name": "port",
            "set": "19"
          },
          {
            "flags": 4,
            "get": "20",
            "name": "pathname",
            "set": "21"
          },
          {
            "flags": 4,
            "get": "22",
            "name": "search",
            "set": "23"
          },
          {
            "flags": 4,
            "get": "24",
            "name": "hash",
            "set": "25"
          },
          {
            "flags": 4,
            "name": "assign",
            "object": "26"
          }
        ],
        "prototypeId": "8"
      }
    },
    {
      "className": "LocationPrototype",
      "objectId": "8"
    },
    {
      "className": "Function",
      "objectId": "9"
    },
    {
      "className": "Function",
      "objectId": "10"
    },
    {
      "className": "Function",
      "objectId": "11"
    },
    {
      "className": "Function",
      "objectId": "12"
    },
    {
      "className": "Function",
      "objectId": "13"
    },
    {
      "className": "Function",
      "objectId": "14"
    },
    {
      "className": "Function",
      "objectId": "15"
    },
    {
      "className": "Function",
      "objectId": "16"
    },
    {
      "className": "Function",
      "objectId": "17"
    },
    {
      "className": "Function",
      "objectId": "18"
    },
    {
      "className": "Function",
      "objectId": "19"
    },
    {
      "className": "Function",
      "objectId": "20"
    },
    {
      "className": "Function",
      "objectId": "21"
    },
    {
      "className": "Function",
      "objectId": "22"
    },
    {
      "className": "Function",
      "objectId": "23"
    },
    {
      "className": "Function",
      "objectId": "24"
    },
    {
      "className": "Function",
      "objectId": "25"
    },
    {
      "className": "Function",
      "objectId": "26"
    },
    {
      "className": "Location",
      "objectId": "7",
      "preview": {
        "getterValues": [
          {
            "name": "href",
            "value": "file:///Users/bvaughn/Desktop/temp-error-stack.html"
          },
          {
            "name": "origin",
            "value": "null"
          },
          {
            "name": "protocol",
            "value": "file:"
          },
          {
            "name": "host",
            "value": ""
          },
          {
            "name": "hostname",
            "value": ""
          },
          {
            "name": "port",
            "value": ""
          },
          {
            "name": "pathname",
            "value": "/Users/bvaughn/Desktop/temp-error-stack.html"
          },
          {
            "name": "search",
            "value": ""
          },
          {
            "name": "hash",
            "value": ""
          }
        ],
        "properties": [
          {
            "flags": 4,
            "get": "9",
            "name": "href",
            "set": "10"
          },
          {
            "flags": 4,
            "get": "11",
            "name": "origin"
          },
          {
            "flags": 4,
            "get": "12",
            "name": "protocol",
            "set": "13"
          },
          {
            "flags": 4,
            "get": "14",
            "name": "host",
            "set": "15"
          },
          {
            "flags": 4,
            "get": "16",
            "name": "hostname",
            "set": "17"
          },
          {
            "flags": 4,
            "get": "18",
            "name": "port",
            "set": "19"
          },
          {
            "flags": 4,
            "get": "20",
            "name": "pathname",
            "set": "21"
          },
          {
            "flags": 4,
            "get": "22",
            "name": "search",
            "set": "23"
          },
          {
            "flags": 4,
            "get": "24",
            "name": "hash",
            "set": "25"
          },
          {
            "flags": 4,
            "name": "assign",
            "object": "26"
          },
          {
            "flags": 4,
            "name": "replace",
            "object": "27"
          },
          {
            "flags": 4,
            "name": "reload",
            "object": "28"
          },
          {
            "flags": 4,
            "name": "toString",
            "object": "29"
          },
          {
            "flags": 0,
            "name": "valueOf",
            "object": "30"
          },
          {
            "flags": 0,
            "isSymbol": true,
            "name": "Symbol(Symbol.toPrimitive)"
          }
        ],
        "prototypeId": "8"
      }
    },
    {
      "className": "Function",
      "objectId": "9",
      "preview": {
        "functionName": "get href",
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
            "value": "get href"
          }
        ],
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "31"
    },
    {
      "className": "Function",
      "objectId": "10",
      "preview": {
        "functionName": "set href",
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
            "value": "set href"
          }
        ],
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "11",
      "preview": {
        "functionName": "get origin",
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
            "value": "get origin"
          }
        ],
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "12",
      "preview": {
        "functionName": "get protocol",
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
            "value": "get protocol"
          }
        ],
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "13",
      "preview": {
        "functionName": "set protocol",
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
            "value": "set protocol"
          }
        ],
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "14",
      "preview": {
        "functionName": "get host",
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
            "value": "get host"
          }
        ],
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "15",
      "preview": {
        "functionName": "set host",
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
            "value": "set host"
          }
        ],
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "16",
      "preview": {
        "functionName": "get hostname",
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
            "value": "get hostname"
          }
        ],
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "17",
      "preview": {
        "functionName": "set hostname",
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
            "value": "set hostname"
          }
        ],
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "18",
      "preview": {
        "functionName": "get port",
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
            "value": "get port"
          }
        ],
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "19",
      "preview": {
        "functionName": "set port",
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
            "value": "set port"
          }
        ],
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "20",
      "preview": {
        "functionName": "get pathname",
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
            "value": "get pathname"
          }
        ],
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "21",
      "preview": {
        "functionName": "set pathname",
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
            "value": "set pathname"
          }
        ],
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "22",
      "preview": {
        "functionName": "get search",
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
            "value": "get search"
          }
        ],
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "23",
      "preview": {
        "functionName": "set search",
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
            "value": "set search"
          }
        ],
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "24",
      "preview": {
        "functionName": "get hash",
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
            "value": "get hash"
          }
        ],
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "25",
      "preview": {
        "functionName": "set hash",
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
            "value": "set hash"
          }
        ],
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "26",
      "preview": {
        "functionName": "assign",
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
            "value": "assign"
          }
        ],
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "27",
      "preview": {
        "functionName": "replace",
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
            "value": "replace"
          }
        ],
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "28",
      "preview": {
        "functionName": "reload",
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
            "value": "reload"
          }
        ],
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "29",
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
        "prototypeId": "31"
      }
    },
    {
      "className": "Function",
      "objectId": "30",
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
        "prototypeId": "31"
      }
    }
  ]
}
}
},
{
"args": [
{
  "column": 4,
  "line": 11,
  "sourceId": "h1"
},
{
  "point": "11529214981643960388",
  "time": 48,
  "frame": [
    {
      "sourceId": "1",
      "line": 11,
      "column": 4,
      "functionId": "2",
      "offset": 68
    },
    {
      "sourceId": "h1",
      "line": 11,
      "column": 4
    }
  ]
},
"\\n    const finalData = { frames: [], scopes: [], objects: [] };\\n    function addPauseData({ frames, scopes, objects }) {\\n          finalData.frames.push(...(frames || []));\\n          finalData.scopes.push(...(scopes || []));\\n          finalData.objects.push(...(objects || []));\\n    }\\n    function getTopFrame() {\\n          const { frame, data } = sendCommand(\\"Pause.getTopFrame\\");\\n      addPauseData(data);\\n      return finalData.frames.find(f => f.frameId == frame);\\n    }\\n\\n      const { point, time, pauseId } = input;\\n      const { frameId, functionName, location } = getTopFrame();\\n\\n      const bindings = [\\n            { name: \\"displayName\\", value: functionName || \\"\\" }\\n      ];\\n      const { result } = sendCommand(\\"Pause.evaluateInFrame\\", {\\n            frameId,\\n            bindings,\\n            expression: \\"[\\" + \\"foo\\" + \\"]\\",\\n        useOriginalScopes: true,\\n      });\\n      const values = [];\\n      addPauseData(result.data);\\n      if (result.exception) {\\n            values.push(result.exception);\\n      } else {\\n            {\\n          const { object } = result.returned;\\n      const { result: lengthResult } = sendCommand(\\n            \\"Pause.getObjectProperty\\",\\n        { object, name: \\"length\\" }\\n      );\\n      addPauseData(lengthResult.data);\\n      const length = lengthResult.returned.value;\\n      for (let i = 0; i < length; i++) {\\n            const { result: elementResult } = sendCommand(\\n              \\"Pause.getObjectProperty\\",\\n          { object, name: i.toString() }\\n        );\\n        values.push(elementResult.returned);\\n        addPauseData(elementResult.data);\\n      }\\n    }\\n      }\\n      return [{\\n            key: point,\\n            value: { time, pauseId, location, values, data: finalData },\\n      }];\\n    "
],
"isAsync": true,
"method": "runAnalysis",
"result": {
"time": 48,
"pauseId": "5574f306-a201-4b9b-963f-36f5bf35417c",
"location": [
  {
    "sourceId": "1",
    "line": 11,
    "column": 4,
    "functionId": "2",
    "offset": 68
  },
  {
    "sourceId": "h1",
    "line": 11,
    "column": 4
  }
],
"values": [
  {
    "object": "7"
  }
],
"data": {
  "frames": [
    {
      "frameId": "0",
      "functionLocation": [
        {
          "column": 14,
          "line": 10,
          "sourceId": "1"
        },
        {
          "sourceId": "h1",
          "line": 10,
          "column": 14
        }
      ],
      "functionName": "foo",
      "location": [
        {
          "sourceId": "1",
          "line": 11,
          "column": 4,
          "functionId": "2",
          "offset": 68
        },
        {
          "sourceId": "h1",
          "line": 11,
          "column": 4
        }
      ],
      "scopeChain": [
        "4",
        "1",
        "2"
      ],
      "this": {
        "object": "3"
      },
      "type": "call"
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
      "objectId": "5",
      "preview": {
        "getterValues": [
          {
            "name": "length",
            "value": 1
          }
        ],
        "properties": [
          {
            "name": "0",
            "object": "7"
          },
          {
            "flags": 1,
            "name": "length",
            "value": 1
          }
        ],
        "prototypeId": "6"
      }
    },
    {
      "className": "Array",
      "objectId": "6"
    },
    {
      "className": "Function",
      "objectId": "7",
      "preview": {
        "functionLocation": [
          {
            "column": 14,
            "line": 10,
            "sourceId": "1"
          },
          {
            "sourceId": "h1",
            "line": 10,
            "column": 14
          }
        ],
        "functionName": "foo",
        "functionParameterNames": [],
        "getterValues": [
          {
            "name": "arguments",
            "object": "10"
          },
          {
            "name": "caller",
            "value": null
          }
        ],
        "properties": [
          {
            "flags": 1,
            "name": "prototype",
            "object": "9"
          },
          {
            "flags": 2,
            "name": "length",
            "value": 0
          },
          {
            "flags": 2,
            "name": "name",
            "value": "foo"
          }
        ],
        "prototypeId": "8"
      }
    },
    {
      "className": "Function",
      "objectId": "8"
    },
    {
      "className": "Object",
      "objectId": "9"
    },
    {
      "className": "Arguments",
      "objectId": "10"
    },
    {
      "className": "Function",
      "objectId": "7",
      "preview": {
        "functionLocation": [
          {
            "column": 14,
            "line": 10,
            "sourceId": "1"
          },
          {
            "sourceId": "h1",
            "line": 10,
            "column": 14
          }
        ],
        "functionName": "foo",
        "functionParameterNames": [],
        "getterValues": [
          {
            "name": "arguments",
            "object": "10"
          },
          {
            "name": "caller",
            "value": null
          }
        ],
        "properties": [
          {
            "flags": 1,
            "name": "prototype",
            "object": "9"
          },
          {
            "flags": 2,
            "name": "length",
            "value": 0
          },
          {
            "flags": 2,
            "name": "name",
            "value": "foo"
          }
        ],
        "prototypeId": "8"
      }
    },
    {
      "className": "Object",
      "objectId": "9",
      "preview": {
        "properties": [
          {
            "flags": 3,
            "name": "constructor",
            "object": "7"
          }
        ],
        "prototypeId": "11"
      }
    },
    {
      "className": "Object",
      "objectId": "11"
    },
    {
      "className": "Arguments",
      "objectId": "10",
      "preview": {
        "properties": [
          {
            "flags": 3,
            "name": "length",
            "value": 0
          },
          {
            "flags": 3,
            "name": "callee",
            "object": "7"
          },
          {
            "flags": 3,
            "isSymbol": true,
            "name": "Symbol(Symbol.iterator)",
            "object": "12"
          }
        ],
        "prototypeId": "11"
      }
    },
    {
      "className": "Function",
      "objectId": "12"
    }
  ]
}
}
},
{
"args": [
"8",
"5574f306-a201-4b9b-963f-36f5bf35417c",
"canOverflow"
],
"isAsync": true,
"method": "getObjectWithPreview",
"result": {
"objects": [
  {
    "className": "Function",
    "objectId": "8",
    "preview": {
      "functionName": "",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 3,
          "name": "toString",
          "object": "13"
        },
        {
          "flags": 3,
          "name": "apply",
          "object": "14"
        },
        {
          "flags": 3,
          "name": "call",
          "object": "15"
        },
        {
          "flags": 3,
          "name": "bind",
          "object": "16"
        },
        {
          "flags": 2,
          "get": "17",
          "name": "arguments",
          "set": "18"
        },
        {
          "flags": 2,
          "get": "19",
          "name": "caller",
          "set": "20"
        },
        {
          "flags": 3,
          "name": "constructor",
          "object": "21"
        },
        {
          "flags": 2,
          "name": "length",
          "value": 0
        },
        {
          "flags": 2,
          "name": "name",
          "value": ""
        },
        {
          "flags": 0,
          "isSymbol": true,
          "name": "Symbol(Symbol.hasInstance)",
          "object": "22"
        }
      ],
      "prototypeId": "11"
    }
  },
  {
    "className": "Function",
    "objectId": "13",
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
      "prototypeId": "8"
    }
  },
  {
    "className": "Function",
    "objectId": "14",
    "preview": {
      "functionName": "apply",
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
          "value": "apply"
        }
      ],
      "prototypeId": "8"
    }
  },
  {
    "className": "Function",
    "objectId": "15",
    "preview": {
      "functionName": "call",
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
          "value": "call"
        }
      ],
      "prototypeId": "8"
    }
  },
  {
    "className": "Function",
    "objectId": "16",
    "preview": {
      "functionName": "bind",
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
          "value": "bind"
        }
      ],
      "prototypeId": "8"
    }
  },
  {
    "className": "Function",
    "objectId": "17",
    "preview": {
      "functionName": "get arguments",
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
          "value": "get arguments"
        }
      ],
      "prototypeId": "8"
    }
  },
  {
    "className": "Function",
    "objectId": "18",
    "preview": {
      "functionName": "set arguments",
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
          "value": "set arguments"
        }
      ],
      "prototypeId": "8"
    }
  },
  {
    "className": "Function",
    "objectId": "19",
    "preview": {
      "functionName": "get caller",
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
          "value": "get caller"
        }
      ],
      "prototypeId": "8"
    }
  },
  {
    "className": "Function",
    "objectId": "20",
    "preview": {
      "functionName": "set caller",
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
          "value": "set caller"
        }
      ],
      "prototypeId": "8"
    }
  },
  {
    "className": "Function",
    "objectId": "21",
    "preview": {
      "functionName": "Function",
      "functionParameterNames": [],
      "getterValues": [],
      "properties": [
        {
          "flags": 0,
          "name": "prototype",
          "object": "8"
        },
        {
          "flags": 2,
          "name": "length",
          "value": 1
        },
        {
          "flags": 2,
          "name": "name",
          "value": "Function"
        }
      ],
      "prototypeId": "8"
    }
  },
  {
    "className": "Function",
    "objectId": "22",
    "preview": {
      "functionName": "[Symbol.hasInstance]",
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
          "value": "[Symbol.hasInstance]"
        }
      ],
      "prototypeId": "8"
    }
  }
]
}
},
{
"args": [
{
  "column": 4,
  "line": 11,
  "sourceId": "h1"
},
{
  "point": "11529214981643960388",
  "time": 48,
  "frame": [
    {
      "sourceId": "1",
      "line": 11,
      "column": 4,
      "functionId": "2",
      "offset": 68
    },
    {
      "sourceId": "h1",
      "line": 11,
      "column": 4
    }
  ]
},
"\\n    const finalData = { frames: [], scopes: [], objects: [] };\\n    function addPauseData({ frames, scopes, objects }) {\\n          finalData.frames.push(...(frames || []));\\n          finalData.scopes.push(...(scopes || []));\\n          finalData.objects.push(...(objects || []));\\n    }\\n    function getTopFrame() {\\n          const { frame, data } = sendCommand(\\"Pause.getTopFrame\\");\\n      addPauseData(data);\\n      return finalData.frames.find(f => f.frameId == frame);\\n    }\\n\\n      const { point, time, pauseId } = input;\\n      const { frameId, functionName, location } = getTopFrame();\\n\\n      const bindings = [\\n            { name: \\"displayName\\", value: functionName || \\"\\" }\\n      ];\\n      const { result } = sendCommand(\\"Pause.evaluateInFrame\\", {\\n            frameId,\\n            bindings,\\n            expression: \\"[\\" + \\"z\\" + \\"]\\",\\n        useOriginalScopes: true,\\n      });\\n      const values = [];\\n      addPauseData(result.data);\\n      if (result.exception) {\\n            values.push(result.exception);\\n      } else {\\n            {\\n          const { object } = result.returned;\\n      const { result: lengthResult } = sendCommand(\\n            \\"Pause.getObjectProperty\\",\\n        { object, name: \\"length\\" }\\n      );\\n      addPauseData(lengthResult.data);\\n      const length = lengthResult.returned.value;\\n      for (let i = 0; i < length; i++) {\\n            const { result: elementResult } = sendCommand(\\n              \\"Pause.getObjectProperty\\",\\n          { object, name: i.toString() }\\n        );\\n        values.push(elementResult.returned);\\n        addPauseData(elementResult.data);\\n      }\\n    }\\n      }\\n      return [{\\n            key: point,\\n            value: { time, pauseId, location, values, data: finalData },\\n      }];\\n    "
],
"isAsync": true,
"method": "runAnalysis",
"result": {
"time": 48,
"pauseId": "a31a5d89-9024-40dc-b63e-82704ed5a7b4",
"location": [
  {
    "sourceId": "1",
    "line": 11,
    "column": 4,
    "functionId": "2",
    "offset": 68
  },
  {
    "sourceId": "h1",
    "line": 11,
    "column": 4
  }
],
"values": [
  {
    "object": "5"
  }
],
"data": {
  "frames": [
    {
      "frameId": "0",
      "functionLocation": [
        {
          "column": 14,
          "line": 10,
          "sourceId": "1"
        },
        {
          "sourceId": "h1",
          "line": 10,
          "column": 14
        }
      ],
      "functionName": "foo",
      "location": [
        {
          "sourceId": "1",
          "line": 11,
          "column": 4,
          "functionId": "2",
          "offset": 68
        },
        {
          "sourceId": "h1",
          "line": 11,
          "column": 4
        }
      ],
      "scopeChain": [
        "4",
        "1",
        "2"
      ],
      "this": {
        "object": "3"
      },
      "type": "call"
    }
  ],
  "scopes": [],
  "objects": [
    {
      "className": "Window",
      "objectId": "3"
    },
    {
      "className": "ReferenceError",
      "objectId": "5",
      "preview": {
        "getterValues": [
          {
            "name": "name",
            "value": "ReferenceError"
          },
          {
            "name": "message",
            "value": "z is not defined"
          },
          {
            "name": "stack",
            "value": "@debugger eval code:1:2\\nfoo@file:///Users/bvaughn/Desktop/temp-error-stack.html:11:5\\n@file:///Users/bvaughn/Desktop/temp-error-stack.html:25:3\\n"
          },
          {
            "name": "fileName",
            "value": "debugger eval code"
          },
          {
            "name": "lineNumber",
            "value": 1
          },
          {
            "name": "columnNumber",
            "value": 2
          }
        ],
        "properties": [
          {
            "flags": 3,
            "name": "fileName",
            "value": "debugger eval code"
          },
          {
            "flags": 3,
            "name": "lineNumber",
            "value": 1
          },
          {
            "flags": 3,
            "name": "columnNumber",
            "value": 2
          },
          {
            "flags": 3,
            "name": "message",
            "value": "z is not defined"
          }
        ],
        "prototypeId": "6"
      }
    },
    {
      "className": "ReferenceError.prototype",
      "objectId": "6"
    }
  ]
}
}
}
]`)
);

export default function SourceAndConsole() {
  return (
    <ReplayClientContext.Provider value={replayClientPlayer}>
      <Initializer accessToken={ACCESS_TOKEN} recordingId={RECORDING_ID}>
        <PointsContextRoot>
          <PauseContextRoot>
            <FocusContextRoot>
              <div className={styles.HorizontalContainer}>
                <div className={styles.VerticalContainer}>
                  <Sources />
                </div>
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
