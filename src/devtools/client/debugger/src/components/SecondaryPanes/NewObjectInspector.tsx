import Inspector from "@bvaughn/components/inspector";
import Expandable from "@bvaughn/components/Expandable";
import Loader from "@bvaughn/components/Loader";
import "@bvaughn/pages/variables.css";
import { ObjectPreviewError, preCacheObjects } from "@bvaughn/src/suspense/ObjectPreviews";
import { clientValueToProtocolNamedValue } from "@bvaughn/src/utils/protocol";
import { NamedValue as ProtocolNamedValue, SessionId } from "@replayio/protocol";
import { ContainerItem, ValueItem } from "devtools/packages/devtools-reps";
import { client } from "protocol/socket";
import { ThreadFront } from "protocol/thread";
import { Component, PropsWithChildren, ReactNode, Suspense, useMemo } from "react";

export default function NewObjectInspector({ roots }: { roots: Array<ContainerItem | ValueItem> }) {
  const pause = ThreadFront.currentPause;

  // HACK
  // The new Object Inspector does not consume ValueFronts.
  // It works with the Replay protocol's Value objects directly.
  // At the moment this means that we need to convert the ValueFront back to a protocol Value.
  const children: ReactNode[] | null = useMemo(() => {
    if (pause == null || pause.pauseId == null) {
      return null;
    }

    const children: ReactNode[] = [];

    roots.forEach((root: ContainerItem | ValueItem, index) => {
      switch (root.type) {
        case "container": {
          const protocolValues: ProtocolNamedValue[] = root.contents.map(
            clientValueToProtocolNamedValue
          );
          children.push(
            <Expandable
              key={index}
              header={root.name}
              children={protocolValues.map((protocolValue, index) => (
                <Inspector key={index} pauseId={pause.pauseId!} protocolValue={protocolValue} />
              ))}
            />
          );
          break;
        }
        case "value": {
          const protocolValue = clientValueToProtocolNamedValue(root);
          children.push(
            <Inspector key={index} pauseId={pause.pauseId!} protocolValue={protocolValue} />
          );
          break;
        }
      }
    });

    return children;
  }, [pause, roots]);

  return (
    <div className="preview-popup">
      <Suspense fallback={<Loader />}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </Suspense>
    </div>
  );
}

type ErrorBoundaryState = {
  error: Error | null;
};

class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
  };

  async loadPauseData(sessionId: SessionId) {
    const pause = ThreadFront.currentPause;
    if (pause) {
      const { pauseId, point } = pause;
      if (pauseId && point) {
        const { data } = await client.Session.createPause({ point }, sessionId);
        if (data.objects) {
          preCacheObjects(pauseId, data.objects);
          this.setState({ error: null });
        }
      }
    }
  }

  componentDidCatch(error: Error) {
    // const canRecover = error.message.includes('Could not find object with id');
    // @ts-ignore
    const canRecover = error instanceof ObjectPreviewError;
    if (canRecover) {
      const sessionId = ThreadFront.sessionId;
      if (sessionId) {
        this.loadPauseData(sessionId);
      }
    }
  }

  static getDerivedStateFromError(error: Error) {
    return {
      error,
    };
  }

  render() {
    const { children } = this.props;
    const { error } = this.state;

    if (error != null) {
      // @ts-ignore
      const canRecover = error instanceof ObjectPreviewError;
      if (canRecover) {
        return null;
      } else {
        return <pre>{error.message}</pre>;
      }
    } else {
      return children;
    }
  }
}
