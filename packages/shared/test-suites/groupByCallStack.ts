/*
    Example of events
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
    }
*/


type CallStackFrame = {
    columnNumber: number;
    fileName: string;
    functionName: string | void;
    lineNumber: number;
}

export type Event = {
    type: undefined;
    command: {
        name: string;
        arguments: any[]
    };
    call_stack: CallStackFrame[];
}

export type FrameStep = {
    type: "function";
    name: string;
    location: {
        fileName: string;
        lineNumber: number;
        columnNumber: number
    }
    children: Array<(Event | FrameStep)>;
}

function makeFrameStep(frame: CallStackFrame): FrameStep {
    return {
        type: "function",
        name: frame.functionName || frame.fileName,
        location: {
            fileName: frame.fileName,
            lineNumber: frame.lineNumber,
            columnNumber: frame.columnNumber
        },
        children: []
    }
}

export function groupByCallStacks(events: Event[]): FrameStep {
    // let frameSteps: FrameStep[] = [];
    let activeStep: FrameStep | null = null;
    let eventIndex: number = 0
    let currentEvent: Event;
    const callStack: FrameStep[] = []


    const firstEvent = events[0];
    const lastFrame = firstEvent.call_stack[firstEvent.call_stack.length - 1]

    activeStep = makeFrameStep(lastFrame)
    const rootStep = activeStep;
    callStack.push(activeStep)

    for (let i = firstEvent.call_stack.length - 2; i >= 0; i--) {
        const frame = firstEvent.call_stack[i];
        const frameStep = makeFrameStep(frame);
        callStack.push(frameStep)
        activeStep.children.push(frameStep);
        activeStep = frameStep;
    }

    console.log(callStack.map(f => f.name))


    activeStep.children.push(firstEvent);
    currentEvent = events[++eventIndex];
    for (let currentEvent of events.slice(1)) {
        let matchingFrameIndex = -1;
        let frameIndex = 0;
        while (matchingFrameIndex == -1 && frameIndex < currentEvent.call_stack.length - 1) {
            let frame = currentEvent.call_stack[frameIndex];
            matchingFrameIndex = callStack.findIndex(frameStep => frameStep.name === frame.functionName);
            if (matchingFrameIndex == -1) {
                frameIndex += 1
            }
        }

        if (matchingFrameIndex !== -1) {
            activeStep = callStack[matchingFrameIndex];
            while (callStack.length > matchingFrameIndex + 1) {
                callStack.pop();
            }
        }

        activeStep.children.push(currentEvent)
        for (let i = matchingFrameIndex; i >= 0; i--) {
            const frame = currentEvent.call_stack[i];
            if (!frame) {
                continue
            }
            const matchedFrameIndex = callStack.findIndex(frameStep => frameStep.name === frame.functionName || frameStep.name === frame.fileName)
            if (matchedFrameIndex === -1) {
                const frameStep = makeFrameStep(frame);
                callStack.push(frameStep)
                activeStep.children.push(frameStep);
                activeStep = frameStep;
            }
        }
    }

    return rootStep;
}
