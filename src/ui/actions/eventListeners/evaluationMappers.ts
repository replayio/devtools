import {
  EVENT_CLASS_FOR_EVENT_TYPE,
  InteractionEventKind,
  REACT_16_EVENT_LISTENER_PROP_KEY,
  REACT_17_18_EVENT_LISTENER_PROP_KEY,
  REACT_EVENT_PROPS,
} from "./constants";

type AnyFunction = (...args: any[]) => any;

// Local variables in scope at the time of evaluation
declare let event: MouseEvent | KeyboardEvent;

interface InjectedValues {
  eventType: InteractionEventKind;
  $REACT_16_EVENT_LISTENER_PROP_KEY: string;
  $REACT_17_18_EVENT_LISTENER_PROP_KEY: string;
  EVENT_CLASS_NAMES: string[];
  possibleReactPropNames: string[];
  args: any[];
}

interface SearchedNode {
  name: string;
  searchPropKeys?: string[];
  propKeys?: string[];
}

interface EventMapperResult {
  target: HTMLElement;
  fieldName?: string;
  handlerProp?: AnyFunction;
  handlerNode?: HTMLElement;
  searchedNodes: SearchedNode[];
  searchedNodesString: string;
  clickWasInsideSubmitButton?: boolean;
}

export function createReactEventMapper(eventType: InteractionEventKind) {
  const reactEventPropNames = REACT_EVENT_PROPS[eventType];
  const eventClassNames = EVENT_CLASS_FOR_EVENT_TYPE[eventType];

  // This will became evaluated JS code
  function findEventTargetAndHandler(injectedValues: InjectedValues) {
    // Debugging: trace nodes we've looked at, like `"input#id.classname"`
    function stringifyNode(node: HTMLElement) {
      const tokens = [node.nodeName];

      if (node.id) {
        tokens.push("#" + node.id);
      }

      if (typeof node.className === "string") {
        for (const className of node.className.split(" ")) {
          tokens.push("." + className);
        }
      }

      return tokens.join("").toLowerCase();
    }

    // One of the args should be a browser event. There could be multiple event class types we're looking for,
    // such as `MouseEvent` or `InputEvent`, so loop over the args _and_ the class names.
    const eventArgs = injectedValues.args.filter(a => typeof a === "object" && a instanceof Event);
    const matchingEvent = eventArgs.find(a => {
      const matchesEventType = injectedValues.EVENT_CLASS_NAMES.some(eventClassName => {
        const eventClass: any = window[eventClassName as any];
        return a instanceof eventClass;
      });
      return matchesEventType;
    });

    if (matchingEvent) {
      const searchedNodes: SearchedNode[] = [];
      const res: EventMapperResult = {
        target: event.target as HTMLElement,
        searchedNodes,
        searchedNodesString: "",
      };

      // Search the event target node and all of its ancestors
      // for React internal props data, and specifically look
      // for the nearest node with a relevant React event handler prop if any.
      const startingNode = event.target as HTMLElement;
      let currentNode = startingNode;
      while (currentNode) {
        const searchedNode: SearchedNode = {
          name: stringifyNode(currentNode),
        };
        searchedNodes.push(searchedNode);

        const currentNodeName = currentNode.nodeName.toLowerCase();

        if (
          injectedValues.eventType === "mousedown" &&
          currentNodeName === "button" &&
          (currentNode as HTMLButtonElement).type === "submit"
        ) {
          res.clickWasInsideSubmitButton = true;
        }

        const keys = Object.keys(currentNode);
        const reactPropsKey = keys.find(key => {
          return (
            key.startsWith(injectedValues.$REACT_16_EVENT_LISTENER_PROP_KEY) ||
            key.startsWith(injectedValues.$REACT_17_18_EVENT_LISTENER_PROP_KEY)
          );
        });

        if (reactPropsKey) {
          let props: Record<string, AnyFunction> = {};
          if (reactPropsKey in currentNode) {
            // @ts-expect-error - this is a dynamic key
            props = currentNode[reactPropsKey];
            searchedNode.propKeys = Object.keys(props);
          }

          // Depending on the type of event, there could be different
          // React event handler prop names in use.
          // For example, an input is likely to have "onChange",
          // whereas some other element might have "onKeyPress".
          let handler = undefined;
          let name: string | undefined = undefined;
          const possibleReactPropNames = injectedValues.possibleReactPropNames.slice();

          // `<input>` tags often have an `onChange` prop, including checkboxes;
          // _If_ the original target DOM node is an input, add that to the list of prop names.
          if (currentNode === startingNode && currentNodeName === "input") {
            possibleReactPropNames.push("onChange");
          }

          if (res.clickWasInsideSubmitButton && currentNodeName === "form") {
            possibleReactPropNames.push("onSubmit");
          }

          searchedNode.searchPropKeys = possibleReactPropNames;

          for (const possibleReactProp of possibleReactPropNames) {
            if (possibleReactProp in props) {
              handler = props[possibleReactProp];
              name = possibleReactProp;
            }
          }

          if (handler) {
            res.handlerProp = handler;
            res.handlerNode = currentNode as HTMLElement;
            res.fieldName = name;
            break;
          }
        }
        currentNode = (currentNode!.parentNode as HTMLElement)!;
      }

      res.searchedNodesString = JSON.stringify(searchedNodes);

      return res;
    } else {
      throw new Error(`no event found! eventClass: ${injectedValues.EVENT_CLASS_NAMES}`);
    }
  }

  // Arrow functions don't have their own `arguments` object,
  // so safety-check to see if we can access it.
  // This does mean that we may not find a React prop target
  // for some listener entry points
  // TODO We could maybe use source outlines to get a list of argument names here.
  // But, that would require unique expressions per evaluated point.
  const evaluatedEventMapperBody = `
    if (typeof arguments !== "undefined") {
      (${findEventTargetAndHandler})({
        eventType: "${eventType}",
        $REACT_16_EVENT_LISTENER_PROP_KEY: "${REACT_16_EVENT_LISTENER_PROP_KEY}",
        $REACT_17_18_EVENT_LISTENER_PROP_KEY: "${REACT_17_18_EVENT_LISTENER_PROP_KEY}",
        EVENT_CLASS_NAMES: ${JSON.stringify(eventClassNames)},
        possibleReactPropNames: ${JSON.stringify(reactEventPropNames)},
        
        // Outer body runs in scope of the "current" event handler.
        // Grab the event handler's arguments.
        args: [...arguments]
      })
    }
    
  `;

  return evaluatedEventMapperBody;
}
