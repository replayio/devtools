import classnames from "classnames";
import { useContext } from "react";

import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { TerminalContext } from "replay-next/src/contexts/TerminalContext";
import { replayClient } from "shared/client/ReplayClientContext";

interface DependencyChainStep {
  code: string;
  time?: number;
  point?: string;
}

const gDependencyChainSteps: Map<string, DependencyChainStep[]> = new Map([
  ["44459041857669043478340039245561858",
    [
      {
        "code": "DispatchInputEventHandler",
        "type": "click",
        "time": 17331.3088745
      },
      {
        "code": "ReactCallSetState",
        "time": 17331.678960611167,
        "point": "44459041857652529030707569733140482"
      },
      {
        "code": "ReactRender",
        "time": 17340.19478082223,
        "point": "44459041857660650209786226521669634",
        "calleeLocation": {
          "line": 127,
          "column": 6,
          "url": "webpack://_N_E/packages/replay-next/components/inspector/KeyValueRenderer.tsx"
        }
      },
      {
        "code": "ReactCreateElement",
        "time": 17340.316344044528,
        "point": "44459041857660730914291523231154176"
      },
      {
        "code": "ReactRender",
        "time": 17341.243697768932,
        "point": "44459041857661346574375043416981506",
        "calleeLocation": {
          "line": 42,
          "column": 17,
          "url": "webpack://_N_E/packages/replay-next/components/inspector/PropertiesRenderer.tsx"
        }
      },
      {
        "code": "ReactCreateElement",
        "time": 17341.81157167882,
        "point": "44459041857661723579706989726400512"
      },
      {
        "code": "ReactRender",
        "time": 17343.768722818182,
        "point": "44459041857663193554625423585837058",
        "calleeLocation": {
          "line": 7,
          "column": 37,
          "url": "webpack://_N_E/packages/replay-next/components/inspector/KeyValueRendererWithContextMenu.tsx"
        }
      },
      {
        "code": "PromiseSettled",
        "point": "44459041857669011196537875894108164",
        "time": 17346.73997951852
      }
    ]
  ],
  ["3894222644151272406095158466052098",
    [
      {
        "code": "UnknownNode",
        "node": {
          "currentProcessId": 76435,
          "kind": "acceptMessage",
          "messageId": 86,
          "processId": 76435
        },
        "time": 758.4744995
      },
      {
        "code": "UnknownEdge",
        "edge": {
          "kind": "executionPoint",
          "point": {
            "checkpoint": 5,
            "position": {
              "frameIndex": 29,
              "functionId": "12:840726",
              "kind": "OnStep",
              "offset": 3
            },
            "progress": 167167
          },
          "executionStartTime": 758.4744995
        }
      },
      {
        "code": "ScriptInitiateNetworkRequest",
        "url": "https://app.replay.io/api/token",
        "time": 769.3905414999999,
        "point": "1298074214826438489213714980405251"
      },
      {
        "code": "NetworkReceiveResource",
        "time": 1343.8489990234375
      },
      {
        "code": "PromiseSettled",
        "time": 1344.026854
      },
      {
        "code": "ReactCallSetState",
        "time": 1344.363162,
        "point": "2596148429463079581576525560938498"
      },
      {
        "code": "ReactRender",
        "time": 1412.3574586321838,
        "point": "2920666983127251316216896981827586",
        "calleeLocation": {
          "line": 42724,
          "column": 10,
          "url": "https://app.replay.io/recording/_next/static/chunks/pages/_app-d753789f6db4329b.js"
        }
      },
      {
        "code": "ReactCreateElement",
        "time": 1413.2570408620688,
        "point": "2920666983127501500183370897817600"
      },
      {
        "code": "ReactRender",
        "time": 1414.2934259195401,
        "point": "2920666983127789730559582739103746",
        "calleeLocation": {
          "line": 35,
          "column": 28,
          "url": "webpack://_N_E/pages/_app.tsx"
        }
      },
      {
        "code": "ReactCallUseEffect",
        "time": 1414.3846278045976,
        "point": "2920666983127815094832546650783747"
      },
      {
        "code": "ReactEffectFirstCall",
        "time": 1419.3662081429227,
        "point": "2920666983128572564259939477880834",
        "calleeLocation": {
          "line": 39,
          "column": 4,
          "url": "webpack://_N_E/pages/_app.tsx"
        }
      },
      {
        "code": "ScriptInitiateNetworkRequest",
        "url": "https://api.replay.io/v1/graphql",
        "time": 1432.87009325,
        "point": "2920666983158403255270927310520325"
      },
      {
        "code": "NetworkReceiveResource",
        "time": 2083.085875484375
      },
      {
        "code": "PromiseSettled",
        "time": 2083.519400390625
      },
      {
        "code": "PromiseSettled",
        "time": 2084.798516
      },
      {
        "code": "PromiseSettled",
        "time": 2084.985562
      },
      {
        "code": "PromiseSettled",
        "point": "3894222644141125543933182325293069",
        "time": 2094.896291
      },
      {
        "code": "PromiseSettled",
        "time": 2095.8905817268724
      },
      {
        "code": "PromiseSettled",
        "point": "3894222644141253518220361189031936",
        "time": 2095.8996207334803
      },
      {
        "code": "PromiseSettled",
        "point": "3894222644141255824063348927889408",
        "time": 2095.9176987466963
      },
      {
        "code": "PromiseSettled",
        "point": "3894222644141261588670897731928068",
        "time": 2095.9628937797356
      },
      {
        "code": "PromiseSettled",
        "point": "3894222644141276576650431851134976",
        "time": 2096.0804008656387
      },
      {
        "code": "PromiseSettled",
        "time": 2096.0804008656387
      },
      {
        "code": "PromiseSettled",
        "point": "3894222644144734188242773555019780",
        "time": 2136.395968243902
      },
      {
        "code": "PromiseSettled",
        "point": "3894222644144738799928766212603904",
        "time": 2136.496464146341
      },
      {
        "code": "PromiseSettled",
        "point": "3894222644144750329143838050877476",
        "time": 2136.647641139349
      },
      {
        "code": "ReactCallSetState",
        "time": 2140.5379655454544,
        "point": "3894222644149982286931743922454530"
      },
      {
        "code": "ReactRender",
        "time": 2147.2423006719746,
        "point": "3894222644150322398775328064405506",
        "calleeLocation": {
          "line": 35,
          "column": 28,
          "url": "webpack://_N_E/pages/_app.tsx"
        }
      },
      {
        "code": "ReactCreateElement",
        "time": 2147.360520426115,
        "point": "3894222644150370821478495782174720"
      },
      {
        "code": "ReactRender",
        "time": 2149.0775216171974,
        "point": "3894222644151074103596263009157122",
        "calleeLocation": {
          "line": 334,
          "column": 0,
          "url": "webpack://_N_E/node_modules/react-redux/es/components/connect.js"
        }
      },
      {
        "code": "ReactCreateElement",
        "time": 2149.4518841719746,
        "point": "3894222644151227442156212511047680"
      },
      {
        "code": "ReactRender",
        "time": 2149.5616596579616,
        "point": "3894222644151272406095158466052098",
        "calleeLocation": {
          "line": 89,
          "column": 21,
          "url": "webpack://_N_E/src/ui/components/App.tsx"
        }
      }
    ]
  ],
]);

let gNextPointId = 1;

export function LoadDependenciesButton() {
  const { point, time, pauseId } = useMostRecentLoadedPause() ?? {};
  const { addMessage } = useContext(TerminalContext);

  const title = "Load dependencies at this point";

  const onClick = async () => {
    if (!point || !time || !pauseId) {
      console.log(`Missing pause point`);
      return;
    }

    const steps = gDependencyChainSteps.get(point);
    if (!steps) {
      console.log(`Steps unavailable for point ${point}`);
      return;
    }

    const pointId = gNextPointId++;

    for (const { code, point: stepPoint, time: stepTime } of steps) {
      if (stepPoint && stepTime) {
        const pauseId = await pauseIdCache.readAsync(
          replayClient,
          stepPoint,
          stepTime
        );
        addMessage({
          expression: `"P${pointId}: ${code}"`,
          frameId: null,
          pauseId,
          point: stepPoint,
          time: stepTime,
        });
      }
    }
  };

  return (
    <button
      className={classnames("devtools-button toolbar-panel-button tab")}
      id="command-button-load-dependencies"
      onClick={onClick}
      title={title}
    />
  );
}
