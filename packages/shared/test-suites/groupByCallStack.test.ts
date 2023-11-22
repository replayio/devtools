import { Event, FrameStep, groupByCallStacks } from "./groupByCallStack"

const events: Event[] = [
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/index.ts",
                "functionName": "startTest",
                "lineNumber": 115
            },
            {
                "columnNumber": 18,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 13
            }
        ]
    },
    {
        "command": {
            "name": "page.goto",
            "arguments": [
                "https://devtools-2a7hg5z9r-recordreplay.vercel.app/recording/12bc3ef2-9c15-463b-93b7-98943c42e6b8?e2e=1"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 14,
                "fileName": "helpers/index.ts",
                "functionName": "startTest",
                "lineNumber": 117
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 13
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/utils.ts",
                "functionName": "waitForRecordingToFinishIndexing",
                "lineNumber": 88
            },
            {
                "columnNumber": 41,
                "fileName": "helpers/index.ts",
                "functionName": "startTest",
                "lineNumber": 122
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 13
            }
        ]
    },
    {
        "command": {
            "name": "locator.getAttribute",
            "arguments": [
                "[data-test-id=\"Timeline-Capsule\"]",
                "data-test-progress"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 49,
                "fileName": "helpers/utils.ts",
                "functionName": "callback",
                "lineNumber": 97
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/utils.ts",
                "functionName": "waitForRecordingToFinishIndexing",
                "lineNumber": 95
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/index.ts",
                "functionName": "startTest",
                "lineNumber": 122
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 13
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 85,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor.retryInterval",
                "lineNumber": 97
            }
        ]
    },
    {
        "command": {
            "name": "locator.getAttribute",
            "arguments": [
                "[data-test-id=\"Timeline-Capsule\"]",
                "data-test-progress"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 49,
                "fileName": "helpers/utils.ts",
                "functionName": "callback",
                "lineNumber": 97
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/utils.ts",
                "functionName": "waitForRecordingToFinishIndexing",
                "lineNumber": 95
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/index.ts",
                "functionName": "startTest",
                "lineNumber": 122
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 13
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 85,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor.retryInterval",
                "lineNumber": 97
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"ViewToggle-DevTools\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 17,
                "fileName": "helpers/index.ts",
                "functionName": "openDevToolsTab",
                "lineNumber": 31
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 14
            }
        ]
    },
    {
        "command": {
            "name": "locator.evaluate",
            "arguments": [
                "[data-test-id=\"ViewToggle-DevTools\"]",
                "attached"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 56,
                "fileName": "helpers/utils.ts",
                "functionName": "getElementClasses",
                "lineNumber": 167
            },
            {
                "columnNumber": 42,
                "fileName": "helpers/index.ts",
                "functionName": "isDevToolsTabActive",
                "lineNumber": 69
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/index.ts",
                "functionName": "openDevToolsTab",
                "lineNumber": 32
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 14
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"ViewToggle-DevTools\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 15,
                "fileName": "helpers/index.ts",
                "functionName": "openDevToolsTab",
                "lineNumber": 36
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 14
            }
        ]
    },
    {
        "command": {
            "name": "locator.evaluate",
            "arguments": [
                "[data-test-id=\"ViewToggle-DevTools\"]",
                "attached"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 56,
                "fileName": "helpers/utils.ts",
                "functionName": "getElementClasses",
                "lineNumber": 167
            },
            {
                "columnNumber": 42,
                "fileName": "helpers/index.ts",
                "functionName": "isDevToolsTabActive",
                "lineNumber": 69
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/index.ts",
                "functionName": "callback",
                "lineNumber": 38
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 18,
                "fileName": "helpers/index.ts",
                "functionName": "openDevToolsTab",
                "lineNumber": 37
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 14
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 24,
                "fileName": "helpers/index.ts",
                "lineNumber": 39
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"ViewToggle-DevTools\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 17,
                "fileName": "helpers/index.ts",
                "functionName": "openDevToolsTab",
                "lineNumber": 31
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 30
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.evaluate",
            "arguments": [
                "[data-test-id=\"ViewToggle-DevTools\"]",
                "attached"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 56,
                "fileName": "helpers/utils.ts",
                "functionName": "getElementClasses",
                "lineNumber": 167
            },
            {
                "columnNumber": 42,
                "fileName": "helpers/index.ts",
                "functionName": "isDevToolsTabActive",
                "lineNumber": 69
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/index.ts",
                "functionName": "openDevToolsTab",
                "lineNumber": 32
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 30
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-name=\"Source-doc_rr_basic.html\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 24
            },
            {
                "columnNumber": 21,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 31
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"AccordionPane-Sources\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 32,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSourceExplorerPanel",
                "lineNumber": 84
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 33
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"AccordionPane-Sources\"] >> role=treeitem"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 44,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "callback",
                "lineNumber": 41
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 39
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 22,
                "fileName": "helpers/source-explorer-panel.ts",
                "lineNumber": 42
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"AccordionPane-Sources\"] >> [data-item-name=\"SourceTreeItem-doc_rr_basic.html\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 28,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 52
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"AccordionPane-Sources\"] >> [aria-expanded=\"false\"][data-expandable=\"true\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 27,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 65
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"AccordionPane-Sources\"] >> [aria-expanded=\"false\"][data-expandable=\"true\"] >> nth=0"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 27,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 70
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.innerHTML",
            "arguments": [
                "[data-test-id=\"AccordionPane-Sources\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 49
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"AccordionPane-Sources\"] >> [data-item-name=\"SourceTreeItem-doc_rr_basic.html\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 28,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 52
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"AccordionPane-Sources\"] >> [aria-expanded=\"false\"][data-expandable=\"true\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 27,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 65
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"AccordionPane-Sources\"] >> [aria-expanded=\"false\"][data-expandable=\"true\"] >> nth=0"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 27,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 70
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.innerHTML",
            "arguments": [
                "[data-test-id=\"AccordionPane-Sources\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 49
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"AccordionPane-Sources\"] >> [data-item-name=\"SourceTreeItem-doc_rr_basic.html\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 28,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 52
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.scrollIntoViewIfNeeded",
            "arguments": [
                "[data-test-id=\"AccordionPane-Sources\"] >> [data-item-name=\"SourceTreeItem-doc_rr_basic.html\"]",
                "attached"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 18,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 57
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"AccordionPane-Sources\"] >> [data-item-name=\"SourceTreeItem-doc_rr_basic.html\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 18,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 58
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.getAttribute",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"Source-doc_rr_basic.html\"]",
                "data-status"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 37,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 833
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 66,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 833
            }
        ]
    },
    {
        "command": {
            "name": "locator.getAttribute",
            "arguments": [
                "[data-test-name=\"Source\"]:visible",
                "data-test-source-id"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 63,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 838
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 7,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 839
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=0"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=1"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=2"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=3"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=4"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=5"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=6"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=7"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=8"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=9"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=10"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=11"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=12"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=13"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=14"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=15"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=16"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=17"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=18"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=19"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=20"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=21"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=22"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=23"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=24"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=25"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=26"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=27"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=28"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=29"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=30"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=31"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=32"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=33"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=34"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"] >> nth=35"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 75,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 845
            },
            {
                "columnNumber": 14,
                "fileName": "helpers/utils.ts",
                "functionName": "map",
                "lineNumber": 82
            },
            {
                "columnNumber": 35,
                "fileName": "helpers/utils.ts",
                "functionName": "mapLocators",
                "lineNumber": 81
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 845
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "#toolbox-content-debugger >> [data-test-name=\"SourceLine\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 34,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 846
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSelectedSource",
                "lineNumber": 829
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-explorer-panel.ts",
                "functionName": "openSource",
                "lineNumber": 78
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 33
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 22,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 855
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 34,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 856
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=Source]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 46,
                "fileName": "helpers/source-panel.ts",
                "functionName": "getCurrentSource",
                "lineNumber": 187
            },
            {
                "columnNumber": 31,
                "fileName": "helpers/source-panel.ts",
                "functionName": "getSourceLine",
                "lineNumber": 439
            },
            {
                "columnNumber": 29,
                "fileName": "helpers/source-panel.ts",
                "functionName": "scrollUntilLineIsVisible",
                "lineNumber": 165
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 42
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-name=Source] >> nth=0"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 22,
                "fileName": "helpers/source-panel.ts",
                "functionName": "getCurrentSource",
                "lineNumber": 189
            },
            {
                "columnNumber": 25,
                "fileName": "helpers/source-panel.ts",
                "functionName": "getSourceLine",
                "lineNumber": 439
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "functionName": "scrollUntilLineIsVisible",
                "lineNumber": 165
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 42
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/source-panel.ts",
                "functionName": "scrollUntilLineIsVisible",
                "lineNumber": 169
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 42
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "keyboard.down",
            "arguments": [
                "Control"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "functionName": "scrollUntilLineIsVisible",
                "lineNumber": 171
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 42
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "keyboard.type",
            "arguments": [
                "p"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 15,
                "fileName": "helpers/source-panel.ts",
                "functionName": "scrollUntilLineIsVisible",
                "lineNumber": 176
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 42
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "keyboard.up",
            "arguments": [
                "Control"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 15,
                "fileName": "helpers/source-panel.ts",
                "functionName": "scrollUntilLineIsVisible",
                "lineNumber": 176
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 42
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.focus",
            "arguments": [
                "[data-test-id=QuickOpenInput]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 15,
                "fileName": "helpers/source-panel.ts",
                "functionName": "scrollUntilLineIsVisible",
                "lineNumber": 176
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 42
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/utils.ts",
                "functionName": "clearTextArea",
                "lineNumber": 15
            },
            {
                "columnNumber": 22,
                "fileName": "helpers/source-panel.ts",
                "functionName": "scrollUntilLineIsVisible",
                "lineNumber": 177
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 42
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.focus",
            "arguments": [
                "[data-test-id=QuickOpenInput]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 18,
                "fileName": "helpers/utils.ts",
                "functionName": "clearTextArea",
                "lineNumber": 19
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "scrollUntilLineIsVisible",
                "lineNumber": 177
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 42
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "keyboard.press",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/utils.ts",
                "functionName": "clearTextArea",
                "lineNumber": 20
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "scrollUntilLineIsVisible",
                "lineNumber": 177
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 42
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "keyboard.press",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/utils.ts",
                "functionName": "clearTextArea",
                "lineNumber": 21
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "scrollUntilLineIsVisible",
                "lineNumber": 177
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 42
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "keyboard.type",
            "arguments": [
                ":21"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "functionName": "scrollUntilLineIsVisible",
                "lineNumber": 178
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 42
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "keyboard.press",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "functionName": "scrollUntilLineIsVisible",
                "lineNumber": 179
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 42
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 29,
                "fileName": "helpers/source-panel.ts",
                "functionName": "scrollUntilLineIsVisible",
                "lineNumber": 181
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=Source]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 46,
                "fileName": "helpers/source-panel.ts",
                "functionName": "getCurrentSource",
                "lineNumber": 187
            },
            {
                "columnNumber": 31,
                "fileName": "helpers/source-panel.ts",
                "functionName": "getSourceLine",
                "lineNumber": 439
            },
            {
                "columnNumber": 29,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSourceLineHitCounts",
                "lineNumber": 816
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 43
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-name=Source] >> nth=0"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 22,
                "fileName": "helpers/source-panel.ts",
                "functionName": "getCurrentSource",
                "lineNumber": 189
            },
            {
                "columnNumber": 25,
                "fileName": "helpers/source-panel.ts",
                "functionName": "getSourceLine",
                "lineNumber": 439
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSourceLineHitCounts",
                "lineNumber": 816
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 43
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-name=Source] >> nth=0 >> [data-test-id=SourceLine-21]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSourceLineHitCounts",
                "lineNumber": 817
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 43
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.getAttribute",
            "arguments": [
                "[data-test-name=Source] >> nth=0 >> [data-test-id=SourceLine-21]",
                "data-test-line-has-hits"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 52,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 820
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForSourceLineHitCounts",
                "lineNumber": 819
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 43
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=Source]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 46,
                "fileName": "helpers/source-panel.ts",
                "functionName": "getCurrentSource",
                "lineNumber": 187
            },
            {
                "columnNumber": 31,
                "fileName": "helpers/source-panel.ts",
                "functionName": "getSourceLine",
                "lineNumber": 439
            },
            {
                "columnNumber": 29,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 45
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-name=Source] >> nth=0"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 22,
                "fileName": "helpers/source-panel.ts",
                "functionName": "getCurrentSource",
                "lineNumber": 189
            },
            {
                "columnNumber": 25,
                "fileName": "helpers/source-panel.ts",
                "functionName": "getSourceLine",
                "lineNumber": 439
            },
            {
                "columnNumber": 23,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 45
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.getAttribute",
            "arguments": [
                "[data-test-name=Source] >> nth=0 >> [data-test-id=SourceLine-21]",
                "data-test-is-scrolling"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 43,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 49
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 48
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 50
            }
        ]
    },
    {
        "command": {
            "name": "mouse.move",
            "arguments": [
                "{\"x\":0,\"y\":0}"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 22,
                "fileName": "helpers/source-panel.ts",
                "functionName": "callback",
                "lineNumber": 60
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 58
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.hover",
            "arguments": [
                "[data-test-name=Source] >> nth=0 >> [data-test-id=SourceLine-21] >> [data-test-name=\"SourceLine-LineNumber\"]",
                "true"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 29,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 61
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 58
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-name=Source] >> nth=0 >> [data-test-id=SourceLine-21] >> [data-test-name=\"BreakpointToggle\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 35,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 64
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 58
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.getAttribute",
            "arguments": [
                "[data-test-name=Source] >> nth=0 >> [data-test-id=SourceLine-21] >> [data-test-name=\"BreakpointToggle\"]",
                "data-test-state"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 49,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 66
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 58
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-name=Source] >> nth=0 >> [data-test-id=SourceLine-21] >> [data-test-name=\"SourceLine-LineNumber\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 77,
                "fileName": "helpers/source-panel.ts",
                "lineNumber": 68
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 58
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForBreakpoint",
                "lineNumber": 670
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"AccordionPane-Breakpoints\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "openPauseInformationPanel",
                "lineNumber": 123
            },
            {
                "columnNumber": 34,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForBreakpoint",
                "lineNumber": 676
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-name=\"ToolbarButton-PauseInformation\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 77,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "openPauseInformationPanel",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForBreakpoint",
                "lineNumber": 676
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "page.waitForSelector",
            "arguments": [
                "[data-test-name=\"BreakpointsList\"]:has-text(\"doc_rr_basic.html\")"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 38,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForBreakpoint",
                "lineNumber": 678
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "elementHandle.waitForSelector",
            "arguments": [
                "[data-test-name=\"PointLocation\"]:has-text(\"21\")"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 27,
                "fileName": "helpers/source-panel.ts",
                "functionName": "waitForBreakpoint",
                "lineNumber": 687
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/source-panel.ts",
                "functionName": "addBreakpoint",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 16
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 200
            },
            {
                "columnNumber": 21,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 18
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 170
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 202
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 18
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"AccordionPane-Breakpoints\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "openPauseInformationPanel",
                "lineNumber": 123
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 172
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 202
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 18
            }
        ]
    },
    {
        "command": {
            "name": "locator.isEnabled",
            "arguments": [
                "[title^=\"Rewind Execution\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 175
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 202
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 18
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[title^=\"Rewind Execution\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 176
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 202
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 18
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 284
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 18
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"AccordionPane-Breakpoints\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "openPauseInformationPanel",
                "lineNumber": 123
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 290
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 18
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 18
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 18
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 18
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 18
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 18
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 18
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 305
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 18
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 18
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 305
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 75
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 18
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected >> .filename"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 39,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 79
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 18
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected >> .line"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 43,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 80
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 18
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 26,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 313
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 112
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 19
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"PanelButton-console\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 62,
                "fileName": "helpers/console-panel.ts",
                "functionName": "openConsolePanel",
                "lineNumber": 241
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 118
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 19
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-id=\"ConsoleRoot\"] >> text=Unavailable..."
            ]
        },
        "call_stack": [
            {
                "columnNumber": 52,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 123
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 19
            }
        ]
    },
    {
        "command": {
            "name": "page.focus",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 14,
                "fileName": "helpers/lexical.ts",
                "functionName": "focus",
                "lineNumber": 23
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "clearText",
                "lineNumber": 6
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 65
            },
            {
                "columnNumber": 20,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 19
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 24,
                "fileName": "helpers/lexical.ts",
                "functionName": "clearText",
                "lineNumber": 12
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 65
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 19
            }
        ]
    },
    {
        "command": {
            "name": "locator.type",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 15,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 68
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 19
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 35,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 43
            },
            {
                "columnNumber": 11,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 19
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-name$=\"CodeTypeAhead\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 18,
                "fileName": "helpers/lexical.ts",
                "functionName": "hideTypeAheadSuggestions",
                "lineNumber": 29
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 45
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 19
            }
        ]
    },
    {
        "command": {
            "name": "locator.press",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 17,
                "fileName": "helpers/lexical.ts",
                "functionName": "hideTypeAheadSuggestions",
                "lineNumber": 31
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 45
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 19
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 51
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 19
            }
        ]
    },
    {
        "command": {
            "name": "locator.press",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 17,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 54
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 19
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 51
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 19
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyEvaluationResult",
                "lineNumber": 347
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 136
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 19
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-name=\"TerminalExpression-Result\"]:has-text('10') >> nth=0"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyExpectedCount",
                "lineNumber": 371
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyEvaluationResult",
                "lineNumber": 356
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 136
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 19
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"ClearConsoleEvaluationsButton\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 72,
                "fileName": "helpers/console-panel.ts",
                "functionName": "clearConsoleEvaluations",
                "lineNumber": 47
            },
            {
                "columnNumber": 11,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 138
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 19
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-message-type=\"terminal-expression\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 54,
                "fileName": "helpers/console-panel.ts",
                "functionName": "callback",
                "lineNumber": 49
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/console-panel.ts",
                "functionName": "clearConsoleEvaluations",
                "lineNumber": 49
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 138
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 19
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 63,
                "fileName": "helpers/console-panel.ts",
                "lineNumber": 49
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 170
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 202
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 20
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"AccordionPane-Breakpoints\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "openPauseInformationPanel",
                "lineNumber": 123
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 172
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 202
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 20
            }
        ]
    },
    {
        "command": {
            "name": "locator.isEnabled",
            "arguments": [
                "[title^=\"Rewind Execution\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 175
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 202
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 20
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[title^=\"Rewind Execution\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 176
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 202
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 20
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 284
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 20
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"AccordionPane-Breakpoints\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "openPauseInformationPanel",
                "lineNumber": 123
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 290
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 20
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 20
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 20
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 20
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 20
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 20
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 20
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 305
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 75
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 20
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected >> .filename"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 39,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 79
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 20
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected >> .line"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 43,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 80
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 20
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 26,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 313
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 112
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 21
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"PanelButton-console\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 62,
                "fileName": "helpers/console-panel.ts",
                "functionName": "openConsolePanel",
                "lineNumber": 241
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 118
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 21
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-id=\"ConsoleRoot\"] >> text=Unavailable..."
            ]
        },
        "call_stack": [
            {
                "columnNumber": 52,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 123
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 21
            }
        ]
    },
    {
        "command": {
            "name": "page.focus",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 14,
                "fileName": "helpers/lexical.ts",
                "functionName": "focus",
                "lineNumber": 23
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "clearText",
                "lineNumber": 6
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 65
            },
            {
                "columnNumber": 20,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 21
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 24,
                "fileName": "helpers/lexical.ts",
                "functionName": "clearText",
                "lineNumber": 12
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 65
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 21
            }
        ]
    },
    {
        "command": {
            "name": "locator.type",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 15,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 68
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 21
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 35,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 43
            },
            {
                "columnNumber": 11,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 21
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-name$=\"CodeTypeAhead\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 18,
                "fileName": "helpers/lexical.ts",
                "functionName": "hideTypeAheadSuggestions",
                "lineNumber": 29
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 45
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 21
            }
        ]
    },
    {
        "command": {
            "name": "locator.press",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 17,
                "fileName": "helpers/lexical.ts",
                "functionName": "hideTypeAheadSuggestions",
                "lineNumber": 31
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 45
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 21
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 51
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 21
            }
        ]
    },
    {
        "command": {
            "name": "locator.press",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 17,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 54
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 21
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 51
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 21
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyEvaluationResult",
                "lineNumber": 347
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 136
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 21
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-name=\"TerminalExpression-Result\"]:has-text('9') >> nth=0"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyExpectedCount",
                "lineNumber": 371
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyEvaluationResult",
                "lineNumber": 356
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 136
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 21
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"ClearConsoleEvaluationsButton\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 72,
                "fileName": "helpers/console-panel.ts",
                "functionName": "clearConsoleEvaluations",
                "lineNumber": 47
            },
            {
                "columnNumber": 11,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 138
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 21
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-message-type=\"terminal-expression\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 54,
                "fileName": "helpers/console-panel.ts",
                "functionName": "callback",
                "lineNumber": 49
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/console-panel.ts",
                "functionName": "clearConsoleEvaluations",
                "lineNumber": 49
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 138
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 21
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 63,
                "fileName": "helpers/console-panel.ts",
                "lineNumber": 49
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 170
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 202
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 22
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"AccordionPane-Breakpoints\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "openPauseInformationPanel",
                "lineNumber": 123
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 172
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 202
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 22
            }
        ]
    },
    {
        "command": {
            "name": "locator.isEnabled",
            "arguments": [
                "[title^=\"Rewind Execution\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 175
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 202
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 22
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[title^=\"Rewind Execution\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 176
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 202
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 22
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 284
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 22
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"AccordionPane-Breakpoints\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "openPauseInformationPanel",
                "lineNumber": 123
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 290
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 22
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 22
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 22
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 22
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 22
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 22
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 22
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 305
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 75
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 22
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected >> .filename"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 39,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 79
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 22
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected >> .line"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 43,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 80
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 22
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 26,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 313
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 112
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 23
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"PanelButton-console\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 62,
                "fileName": "helpers/console-panel.ts",
                "functionName": "openConsolePanel",
                "lineNumber": 241
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 118
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 23
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-id=\"ConsoleRoot\"] >> text=Unavailable..."
            ]
        },
        "call_stack": [
            {
                "columnNumber": 52,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 123
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 23
            }
        ]
    },
    {
        "command": {
            "name": "page.focus",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 14,
                "fileName": "helpers/lexical.ts",
                "functionName": "focus",
                "lineNumber": 23
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "clearText",
                "lineNumber": 6
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 65
            },
            {
                "columnNumber": 20,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 23
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 24,
                "fileName": "helpers/lexical.ts",
                "functionName": "clearText",
                "lineNumber": 12
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 65
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 23
            }
        ]
    },
    {
        "command": {
            "name": "locator.type",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 15,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 68
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 23
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 35,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 43
            },
            {
                "columnNumber": 11,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 23
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-name$=\"CodeTypeAhead\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 18,
                "fileName": "helpers/lexical.ts",
                "functionName": "hideTypeAheadSuggestions",
                "lineNumber": 29
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 45
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 23
            }
        ]
    },
    {
        "command": {
            "name": "locator.press",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 17,
                "fileName": "helpers/lexical.ts",
                "functionName": "hideTypeAheadSuggestions",
                "lineNumber": 31
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 45
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 23
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 51
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 23
            }
        ]
    },
    {
        "command": {
            "name": "locator.press",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 17,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 54
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 23
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 51
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 23
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyEvaluationResult",
                "lineNumber": 347
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 136
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 23
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-name=\"TerminalExpression-Result\"]:has-text('8') >> nth=0"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyExpectedCount",
                "lineNumber": 371
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyEvaluationResult",
                "lineNumber": 356
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 136
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 23
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"ClearConsoleEvaluationsButton\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 72,
                "fileName": "helpers/console-panel.ts",
                "functionName": "clearConsoleEvaluations",
                "lineNumber": 47
            },
            {
                "columnNumber": 11,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 138
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 23
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-message-type=\"terminal-expression\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 54,
                "fileName": "helpers/console-panel.ts",
                "functionName": "callback",
                "lineNumber": 49
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/console-panel.ts",
                "functionName": "clearConsoleEvaluations",
                "lineNumber": 49
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 138
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 23
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 63,
                "fileName": "helpers/console-panel.ts",
                "lineNumber": 49
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 170
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 202
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 24
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"AccordionPane-Breakpoints\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "openPauseInformationPanel",
                "lineNumber": 123
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 172
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 202
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 24
            }
        ]
    },
    {
        "command": {
            "name": "locator.isEnabled",
            "arguments": [
                "[title^=\"Rewind Execution\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 175
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 202
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 24
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[title^=\"Rewind Execution\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 176
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 202
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 24
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 284
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 24
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"AccordionPane-Breakpoints\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "openPauseInformationPanel",
                "lineNumber": 123
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 290
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 24
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 24
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 24
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 24
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 24
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 24
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 24
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 305
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 75
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 24
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected >> .filename"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 39,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 79
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 24
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected >> .line"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 43,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 80
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 24
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 26,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 313
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 112
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 25
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"PanelButton-console\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 62,
                "fileName": "helpers/console-panel.ts",
                "functionName": "openConsolePanel",
                "lineNumber": 241
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 118
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 25
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-id=\"ConsoleRoot\"] >> text=Unavailable..."
            ]
        },
        "call_stack": [
            {
                "columnNumber": 52,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 123
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 25
            }
        ]
    },
    {
        "command": {
            "name": "page.focus",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 14,
                "fileName": "helpers/lexical.ts",
                "functionName": "focus",
                "lineNumber": 23
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "clearText",
                "lineNumber": 6
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 65
            },
            {
                "columnNumber": 20,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 25
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 24,
                "fileName": "helpers/lexical.ts",
                "functionName": "clearText",
                "lineNumber": 12
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 65
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 25
            }
        ]
    },
    {
        "command": {
            "name": "locator.type",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 15,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 68
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 25
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 35,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 43
            },
            {
                "columnNumber": 11,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 25
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-name$=\"CodeTypeAhead\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 18,
                "fileName": "helpers/lexical.ts",
                "functionName": "hideTypeAheadSuggestions",
                "lineNumber": 29
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 45
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 25
            }
        ]
    },
    {
        "command": {
            "name": "locator.press",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 17,
                "fileName": "helpers/lexical.ts",
                "functionName": "hideTypeAheadSuggestions",
                "lineNumber": 31
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 45
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 25
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 51
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 25
            }
        ]
    },
    {
        "command": {
            "name": "locator.press",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 17,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 54
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 25
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 51
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 25
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyEvaluationResult",
                "lineNumber": 347
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 136
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 25
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-name=\"TerminalExpression-Result\"]:has-text('7') >> nth=0"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyExpectedCount",
                "lineNumber": 371
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyEvaluationResult",
                "lineNumber": 356
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 136
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 25
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"ClearConsoleEvaluationsButton\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 72,
                "fileName": "helpers/console-panel.ts",
                "functionName": "clearConsoleEvaluations",
                "lineNumber": 47
            },
            {
                "columnNumber": 11,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 138
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 25
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-message-type=\"terminal-expression\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 54,
                "fileName": "helpers/console-panel.ts",
                "functionName": "callback",
                "lineNumber": 49
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/console-panel.ts",
                "functionName": "clearConsoleEvaluations",
                "lineNumber": 49
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 138
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 25
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 63,
                "fileName": "helpers/console-panel.ts",
                "lineNumber": 49
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 170
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 202
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 26
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"AccordionPane-Breakpoints\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "openPauseInformationPanel",
                "lineNumber": 123
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 172
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 202
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 26
            }
        ]
    },
    {
        "command": {
            "name": "locator.isEnabled",
            "arguments": [
                "[title^=\"Rewind Execution\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 175
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 202
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 26
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[title^=\"Rewind Execution\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 176
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 202
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 26
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 284
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 26
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"AccordionPane-Breakpoints\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "openPauseInformationPanel",
                "lineNumber": 123
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 290
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 26
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 26
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 26
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 26
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 26
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 26
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 26
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 305
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 75
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 26
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected >> .filename"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 39,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 79
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 26
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected >> .line"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 43,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 80
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "rewindToLine",
                "lineNumber": 204
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 26
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 26,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 313
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 112
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 27
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"PanelButton-console\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 62,
                "fileName": "helpers/console-panel.ts",
                "functionName": "openConsolePanel",
                "lineNumber": 241
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 118
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 27
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-id=\"ConsoleRoot\"] >> text=Unavailable..."
            ]
        },
        "call_stack": [
            {
                "columnNumber": 52,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 123
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 27
            }
        ]
    },
    {
        "command": {
            "name": "page.focus",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 14,
                "fileName": "helpers/lexical.ts",
                "functionName": "focus",
                "lineNumber": 23
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "clearText",
                "lineNumber": 6
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 65
            },
            {
                "columnNumber": 20,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 27
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 24,
                "fileName": "helpers/lexical.ts",
                "functionName": "clearText",
                "lineNumber": 12
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 65
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 27
            }
        ]
    },
    {
        "command": {
            "name": "locator.type",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 15,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 68
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 27
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 35,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 43
            },
            {
                "columnNumber": 11,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 27
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-name$=\"CodeTypeAhead\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 18,
                "fileName": "helpers/lexical.ts",
                "functionName": "hideTypeAheadSuggestions",
                "lineNumber": 29
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 45
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 27
            }
        ]
    },
    {
        "command": {
            "name": "locator.press",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 17,
                "fileName": "helpers/lexical.ts",
                "functionName": "hideTypeAheadSuggestions",
                "lineNumber": 31
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 45
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 27
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 51
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 27
            }
        ]
    },
    {
        "command": {
            "name": "locator.press",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 17,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 54
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 27
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 51
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 27
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyEvaluationResult",
                "lineNumber": 347
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 136
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 27
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-name=\"TerminalExpression-Result\"]:has-text('6') >> nth=0"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyExpectedCount",
                "lineNumber": 371
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyEvaluationResult",
                "lineNumber": 356
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 136
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 27
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"ClearConsoleEvaluationsButton\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 72,
                "fileName": "helpers/console-panel.ts",
                "functionName": "clearConsoleEvaluations",
                "lineNumber": 47
            },
            {
                "columnNumber": 11,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 138
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 27
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-message-type=\"terminal-expression\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 54,
                "fileName": "helpers/console-panel.ts",
                "functionName": "callback",
                "lineNumber": 49
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/console-panel.ts",
                "functionName": "clearConsoleEvaluations",
                "lineNumber": 49
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 138
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 27
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 63,
                "fileName": "helpers/console-panel.ts",
                "lineNumber": 49
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 170
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 164
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 28
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"AccordionPane-Breakpoints\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "openPauseInformationPanel",
                "lineNumber": 123
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 172
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 164
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 28
            }
        ]
    },
    {
        "command": {
            "name": "locator.isEnabled",
            "arguments": [
                "[title^=\"Resume\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 175
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 164
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 28
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[title^=\"Resume\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 176
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 164
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 28
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 284
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 28
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"AccordionPane-Breakpoints\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "openPauseInformationPanel",
                "lineNumber": 123
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 290
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 28
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 28
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 28
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 305
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 75
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 28
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected >> .filename"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 39,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 79
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 28
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected >> .line"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 43,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 80
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 28
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 26,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 313
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 112
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 29
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"PanelButton-console\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 62,
                "fileName": "helpers/console-panel.ts",
                "functionName": "openConsolePanel",
                "lineNumber": 241
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 118
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 29
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-id=\"ConsoleRoot\"] >> text=Unavailable..."
            ]
        },
        "call_stack": [
            {
                "columnNumber": 52,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 123
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 29
            }
        ]
    },
    {
        "command": {
            "name": "page.focus",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 14,
                "fileName": "helpers/lexical.ts",
                "functionName": "focus",
                "lineNumber": 23
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "clearText",
                "lineNumber": 6
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 65
            },
            {
                "columnNumber": 20,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 29
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 24,
                "fileName": "helpers/lexical.ts",
                "functionName": "clearText",
                "lineNumber": 12
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 65
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 29
            }
        ]
    },
    {
        "command": {
            "name": "locator.type",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 15,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 68
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 29
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 35,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 43
            },
            {
                "columnNumber": 11,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 29
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-name$=\"CodeTypeAhead\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 18,
                "fileName": "helpers/lexical.ts",
                "functionName": "hideTypeAheadSuggestions",
                "lineNumber": 29
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 45
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 29
            }
        ]
    },
    {
        "command": {
            "name": "locator.press",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 17,
                "fileName": "helpers/lexical.ts",
                "functionName": "hideTypeAheadSuggestions",
                "lineNumber": 31
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 45
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 29
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 51
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 29
            }
        ]
    },
    {
        "command": {
            "name": "locator.press",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 17,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 54
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 29
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 51
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 29
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyEvaluationResult",
                "lineNumber": 347
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 136
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 29
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-name=\"TerminalExpression-Result\"]:has-text('7') >> nth=0"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyExpectedCount",
                "lineNumber": 371
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyEvaluationResult",
                "lineNumber": 356
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 136
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 29
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"ClearConsoleEvaluationsButton\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 72,
                "fileName": "helpers/console-panel.ts",
                "functionName": "clearConsoleEvaluations",
                "lineNumber": 47
            },
            {
                "columnNumber": 11,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 138
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 29
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-message-type=\"terminal-expression\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 54,
                "fileName": "helpers/console-panel.ts",
                "functionName": "callback",
                "lineNumber": 49
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/console-panel.ts",
                "functionName": "clearConsoleEvaluations",
                "lineNumber": 49
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 138
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 29
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 63,
                "fileName": "helpers/console-panel.ts",
                "lineNumber": 49
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 170
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 164
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 30
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"AccordionPane-Breakpoints\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "openPauseInformationPanel",
                "lineNumber": 123
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 172
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 164
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 30
            }
        ]
    },
    {
        "command": {
            "name": "locator.isEnabled",
            "arguments": [
                "[title^=\"Resume\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 175
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 164
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 30
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[title^=\"Resume\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 176
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 164
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 30
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 284
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 30
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"AccordionPane-Breakpoints\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "openPauseInformationPanel",
                "lineNumber": 123
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 290
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 30
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 30
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 30
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 305
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 75
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 30
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected >> .filename"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 39,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 79
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 30
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected >> .line"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 43,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 80
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 30
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 26,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 313
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 112
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 31
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"PanelButton-console\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 62,
                "fileName": "helpers/console-panel.ts",
                "functionName": "openConsolePanel",
                "lineNumber": 241
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 118
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 31
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-id=\"ConsoleRoot\"] >> text=Unavailable..."
            ]
        },
        "call_stack": [
            {
                "columnNumber": 52,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 123
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 31
            }
        ]
    },
    {
        "command": {
            "name": "page.focus",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 14,
                "fileName": "helpers/lexical.ts",
                "functionName": "focus",
                "lineNumber": 23
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "clearText",
                "lineNumber": 6
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 65
            },
            {
                "columnNumber": 20,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 31
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 24,
                "fileName": "helpers/lexical.ts",
                "functionName": "clearText",
                "lineNumber": 12
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 65
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 31
            }
        ]
    },
    {
        "command": {
            "name": "locator.type",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 15,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 68
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 31
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 35,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 43
            },
            {
                "columnNumber": 11,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 31
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-name$=\"CodeTypeAhead\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 18,
                "fileName": "helpers/lexical.ts",
                "functionName": "hideTypeAheadSuggestions",
                "lineNumber": 29
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 45
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 31
            }
        ]
    },
    {
        "command": {
            "name": "locator.press",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 17,
                "fileName": "helpers/lexical.ts",
                "functionName": "hideTypeAheadSuggestions",
                "lineNumber": 31
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 45
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 31
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 51
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 31
            }
        ]
    },
    {
        "command": {
            "name": "locator.press",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 17,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 54
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 31
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 51
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 31
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyEvaluationResult",
                "lineNumber": 347
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 136
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 31
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-name=\"TerminalExpression-Result\"]:has-text('8') >> nth=0"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyExpectedCount",
                "lineNumber": 371
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyEvaluationResult",
                "lineNumber": 356
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 136
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 31
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"ClearConsoleEvaluationsButton\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 72,
                "fileName": "helpers/console-panel.ts",
                "functionName": "clearConsoleEvaluations",
                "lineNumber": 47
            },
            {
                "columnNumber": 11,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 138
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 31
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-message-type=\"terminal-expression\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 54,
                "fileName": "helpers/console-panel.ts",
                "functionName": "callback",
                "lineNumber": 49
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/console-panel.ts",
                "functionName": "clearConsoleEvaluations",
                "lineNumber": 49
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 138
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 31
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 63,
                "fileName": "helpers/console-panel.ts",
                "lineNumber": 49
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 170
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 164
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 32
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"AccordionPane-Breakpoints\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "openPauseInformationPanel",
                "lineNumber": 123
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 172
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 164
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 32
            }
        ]
    },
    {
        "command": {
            "name": "locator.isEnabled",
            "arguments": [
                "[title^=\"Resume\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 175
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 164
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 32
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[title^=\"Resume\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 176
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 164
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 32
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 284
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 32
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"AccordionPane-Breakpoints\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "openPauseInformationPanel",
                "lineNumber": 123
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 290
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 32
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 32
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 32
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 305
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 75
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 32
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected >> .filename"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 39,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 79
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 32
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected >> .line"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 43,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 80
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 32
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 26,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 313
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 112
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 33
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"PanelButton-console\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 62,
                "fileName": "helpers/console-panel.ts",
                "functionName": "openConsolePanel",
                "lineNumber": 241
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 118
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 33
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-id=\"ConsoleRoot\"] >> text=Unavailable..."
            ]
        },
        "call_stack": [
            {
                "columnNumber": 52,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 123
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 33
            }
        ]
    },
    {
        "command": {
            "name": "page.focus",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 14,
                "fileName": "helpers/lexical.ts",
                "functionName": "focus",
                "lineNumber": 23
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "clearText",
                "lineNumber": 6
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 65
            },
            {
                "columnNumber": 20,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 33
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 24,
                "fileName": "helpers/lexical.ts",
                "functionName": "clearText",
                "lineNumber": 12
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 65
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 33
            }
        ]
    },
    {
        "command": {
            "name": "locator.type",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 15,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 68
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 33
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 35,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 43
            },
            {
                "columnNumber": 11,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 33
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-name$=\"CodeTypeAhead\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 18,
                "fileName": "helpers/lexical.ts",
                "functionName": "hideTypeAheadSuggestions",
                "lineNumber": 29
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 45
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 33
            }
        ]
    },
    {
        "command": {
            "name": "locator.press",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 17,
                "fileName": "helpers/lexical.ts",
                "functionName": "hideTypeAheadSuggestions",
                "lineNumber": 31
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 45
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 33
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 51
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 33
            }
        ]
    },
    {
        "command": {
            "name": "locator.press",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 17,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 54
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 33
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 51
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 33
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyEvaluationResult",
                "lineNumber": 347
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 136
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 33
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-name=\"TerminalExpression-Result\"]:has-text('9') >> nth=0"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyExpectedCount",
                "lineNumber": 371
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyEvaluationResult",
                "lineNumber": 356
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 136
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 33
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"ClearConsoleEvaluationsButton\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 72,
                "fileName": "helpers/console-panel.ts",
                "functionName": "clearConsoleEvaluations",
                "lineNumber": 47
            },
            {
                "columnNumber": 11,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 138
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 33
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-message-type=\"terminal-expression\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 54,
                "fileName": "helpers/console-panel.ts",
                "functionName": "callback",
                "lineNumber": 49
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/console-panel.ts",
                "functionName": "clearConsoleEvaluations",
                "lineNumber": 49
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 138
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 33
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 63,
                "fileName": "helpers/console-panel.ts",
                "lineNumber": 49
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 170
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 164
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 34
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"AccordionPane-Breakpoints\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "openPauseInformationPanel",
                "lineNumber": 123
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 172
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 164
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 34
            }
        ]
    },
    {
        "command": {
            "name": "locator.isEnabled",
            "arguments": [
                "[title^=\"Resume\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 175
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 164
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 34
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[title^=\"Resume\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "clickCommandBarButton",
                "lineNumber": 176
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 164
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 34
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 284
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 34
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-id=\"AccordionPane-Breakpoints\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "openPauseInformationPanel",
                "lineNumber": 123
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 290
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 34
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 34
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 34
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 34
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-name=\"ScopesList\"] >> [data-test-name=\"Expandable\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 21,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "callback",
                "lineNumber": 301
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 292
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 34
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 304
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 25,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "timeout",
                "lineNumber": 305
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 75
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 34
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected >> .filename"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 39,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 79
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 34
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"FramesPanel\"] >> .frame.selected >> .line"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 43,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "getCurrentCallStackFrameInfo",
                "lineNumber": 80
            },
            {
                "columnNumber": 30,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 312
            },
            {
                "columnNumber": 7,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "waitForPaused",
                "lineNumber": 311
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/pause-information-panel.ts",
                "functionName": "resumeToLine",
                "lineNumber": 166
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 34
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 26,
                "fileName": "helpers/pause-information-panel.ts",
                "lineNumber": 313
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 112
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 35
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"PanelButton-console\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 62,
                "fileName": "helpers/console-panel.ts",
                "functionName": "openConsolePanel",
                "lineNumber": 241
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 118
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 35
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-id=\"ConsoleRoot\"] >> text=Unavailable..."
            ]
        },
        "call_stack": [
            {
                "columnNumber": 52,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 123
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 35
            }
        ]
    },
    {
        "command": {
            "name": "page.focus",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 14,
                "fileName": "helpers/lexical.ts",
                "functionName": "focus",
                "lineNumber": 23
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "clearText",
                "lineNumber": 6
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 65
            },
            {
                "columnNumber": 20,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 35
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 24,
                "fileName": "helpers/lexical.ts",
                "functionName": "clearText",
                "lineNumber": 12
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 65
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 35
            }
        ]
    },
    {
        "command": {
            "name": "locator.type",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 15,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 68
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 35
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 35,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 43
            },
            {
                "columnNumber": 11,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 35
            }
        ]
    },
    {
        "command": {
            "name": "locator.isVisible",
            "arguments": [
                "[data-test-name$=\"CodeTypeAhead\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 18,
                "fileName": "helpers/lexical.ts",
                "functionName": "hideTypeAheadSuggestions",
                "lineNumber": 29
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 45
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 35
            }
        ]
    },
    {
        "command": {
            "name": "locator.press",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 17,
                "fileName": "helpers/lexical.ts",
                "functionName": "hideTypeAheadSuggestions",
                "lineNumber": 31
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 45
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 35
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 51
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 35
            }
        ]
    },
    {
        "command": {
            "name": "locator.press",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 17,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 54
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 35
            }
        ]
    },
    {
        "command": {
            "name": "locator.textContent",
            "arguments": [
                "[data-test-id=\"ConsoleTerminalInput\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 23,
                "fileName": "helpers/lexical.ts",
                "functionName": "submitCurrentText",
                "lineNumber": 51
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/lexical.ts",
                "functionName": "type",
                "lineNumber": 72
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeTerminalExpression",
                "lineNumber": 125
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 135
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 35
            }
        ]
    },
    {
        "command": {
            "name": "page.evaluate",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 16,
                "fileName": "helpers/utils.ts",
                "functionName": "debugPrint",
                "lineNumber": 33
            },
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyEvaluationResult",
                "lineNumber": 347
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 136
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 35
            }
        ]
    },
    {
        "command": {
            "name": "locator.waitFor",
            "arguments": [
                "[data-test-name=\"TerminalExpression-Result\"]:has-text('10') >> nth=0"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 19,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyExpectedCount",
                "lineNumber": 371
            },
            {
                "columnNumber": 9,
                "fileName": "helpers/console-panel.ts",
                "functionName": "verifyEvaluationResult",
                "lineNumber": 356
            },
            {
                "columnNumber": 3,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 136
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 35
            }
        ]
    },
    {
        "command": {
            "name": "locator.click",
            "arguments": [
                "[data-test-id=\"ClearConsoleEvaluationsButton\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 72,
                "fileName": "helpers/console-panel.ts",
                "functionName": "clearConsoleEvaluations",
                "lineNumber": 47
            },
            {
                "columnNumber": 11,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 138
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 35
            }
        ]
    },
    {
        "command": {
            "name": "locator.count",
            "arguments": [
                "[data-test-message-type=\"terminal-expression\"]"
            ]
        },
        "call_stack": [
            {
                "columnNumber": 54,
                "fileName": "helpers/console-panel.ts",
                "functionName": "callback",
                "lineNumber": 49
            },
            {
                "columnNumber": 13,
                "fileName": "helpers/utils.ts",
                "functionName": "waitFor",
                "lineNumber": 148
            },
            {
                "columnNumber": 16,
                "fileName": "helpers/console-panel.ts",
                "functionName": "clearConsoleEvaluations",
                "lineNumber": 49
            },
            {
                "columnNumber": 5,
                "fileName": "helpers/console-panel.ts",
                "functionName": "executeAndVerifyTerminalExpression",
                "lineNumber": 138
            },
            {
                "columnNumber": 3,
                "fileName": "tests/breakpoints-01.test.ts",
                "lineNumber": 35
            }
        ]
    },
    {
        "command": {
            "name": "expect",
            "arguments": []
        },
        "call_stack": [
            {
                "columnNumber": 63,
                "fileName": "helpers/console-panel.ts",
                "lineNumber": 49
            }
        ]
    }
]

function formatSubTree(step: FrameStep, nesting: number = 1): string {
    let result = "  ".repeat(nesting) + `${step.name}(${step.location.lineNumber}, ${step.location.columnNumber})\n`;
    if (step.children) {
        for (let child of step.children) {
            if (child.type == "function") {
                result += formatSubTree(child, nesting + 1);
            } else {
                result += "  ".repeat(nesting) + '- ' + (child).command.name + '\n';
            }
        }
    }
    return result;
}

function formatTree(frameStep: FrameStep): string {
    let result = frameStep.name + '\n';
    for (let event of frameStep.children) {
        if (event.type == "function") {
            result += formatSubTree(event);
        }
    }
    return result;
}

describe("groupByCallStacks", () => {
    xit("2 events", () => {
        const groupedEvents = groupByCallStacks(events.slice(0, 2));
        console.log(formatTree(groupedEvents))
        // expect(groupedEvents).toBe(2)
    })

    xit("3 events", () => {
        const groupedEvents = groupByCallStacks(events.slice(0, 3));
        console.log(formatTree(groupedEvents))
        // expect(groupedEvents).toBe(2)
    })

    xit("4 events", () => {
        const groupedEvents = groupByCallStacks(events.slice(0, 4));
        console.log(formatTree(groupedEvents))

        // expect(groupedEvents).toBe(2)
    })

    it("5 events", () => {
        const groupedEvents = groupByCallStacks(events.slice(0, 15));
        console.log(formatTree(groupedEvents))

        // expect(groupedEvents).toBe(2)
    })
})